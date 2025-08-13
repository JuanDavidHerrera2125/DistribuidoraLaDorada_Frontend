$(document).ready(function () {
    let client = null;
    let today = new Date().toISOString().split('T')[0];
    $('#date').val(today);

    // Recuperar cliente desde localStorage
    const savedClient = localStorage.getItem('selectedClient');
    if (savedClient) {
        try {
            client = JSON.parse(savedClient);
            $('#clientName').val(client.name || '');
            $('#clientAddress').val(client.address || '');
            $('#clientPhone').val(client.phone || '');
        } catch (e) {
            console.error('Error al cargar el cliente:', e);
            localStorage.removeItem('selectedClient');
            alert('No se pudo cargar el cliente seleccionado.');
        }
    }

    // Validar que haya cliente
    if (!client || !client.id) {
        // Si no hay cliente seleccionado, redirigir a la página de clientes
        // Solo mostrar mensaje si no estamos en la página de clientes
        if (!window.location.pathname.includes('clients.html')) {
            // No redirigir automáticamente para evitar problemas de navegación
            // Solo mostrar mensaje informativo
        }
    }

    // 🔽 Cargar productos con stock > 0
    const $productSelect = $('#product');
    $productSelect.empty().append('<option value="">Cargando productos...</option>');

    $.get('http://localhost:8080/api/products/with-stock', function (products) {
        $productSelect.empty().append('<option value="">Seleccione un producto</option>');

        products.forEach(function (product) {
            // Solo si tiene stock
            if (product.currentStock > 0) {
                const displayName = `${product.name} - ${product.model}`;
                const price = product.unitPrice;

                $productSelect.append(`
                    <option value="${product.productId}"
                            data-name="${displayName}"
                            data-price="${price}"
                            data-stock="${product.currentStock}">
                        ${displayName} ($${price.toLocaleString('es-CO')} COP) - Stock: ${product.currentStock}
                    </option>
                `);
            }
        });

        if ($productSelect.children('option').length === 1) {
            $productSelect.append('<option disabled>No hay productos disponibles</option>');
        }

    }).fail(function () {
        $productSelect.empty().append('<option value="">Error al cargar productos</option>');
    });

    // 🔄 Cuando se selecciona un producto, actualizar precio y max de cantidad
    $productSelect.on('change', function () {
        const $option = $productSelect.find('option:selected');
        const price = $option.data('price');
        const stock = $option.data('stock');

        if (price && stock) {
            $('#price').val(price);
            $('#quantity')
                .val(1)
                .attr('max', stock)
                .prop('max', stock)
                .attr('min', 1)
                .prop('min', 1);
        } else {
            $('#price').val('');
            $('#quantity').val('').removeAttr('max').removeAttr('min');
        }
    });

    // 🔒 Bloquear teclas no deseadas: '-', 'e', '+', '.', ','
    $('#quantity').on('keydown', function (e) {
        if (['-', 'e', 'E', '+', '.', ','].includes(e.key)) {
            e.preventDefault();
        }
    });

    // 📝 Validar cantidad en tiempo real (input y change)
    $('#quantity').on('input change', function () {
        let value = parseInt($(this).val(), 10);
        const max = parseInt($(this).attr('max')) || Infinity;

        if (isNaN(value) || value < 1) {
            $(this).val(1);
            value = 1;
        } else if (value > max) {
            $(this).val(max);
            alert(`La cantidad máxima disponible es ${max}`);
        }
    });

    // ✅ Manejo del formulario de venta
    $('#saleForm').on('submit', function (e) {
        e.preventDefault();

        const productId = $productSelect.val();
        const productName = $productSelect.find('option:selected').data('name');
        const quantity = parseInt($('#quantity').val(), 10);
        const price = parseFloat($('#price').val());

        if (!productId) {
            alert('Por favor, selecciona un producto.');
            return;
        }
        if (isNaN(quantity) || quantity <= 0) {
            alert('La cantidad debe ser un número entero mayor a 0.');
            return;
        }
        if (isNaN(price) || price <= 0) {
            alert('El precio debe ser un número mayor a 0.');
            return;
        }

        // 📦 Datos de la venta (ajustados al DTO esperado por el backend)
        const saleData = {
            clientName: client.name,
            clientPhone: client.phone,
            clientAddress: client.address,
            productName: productName,
            quantity: quantity,
            unitPrice: price
        };

        const $submitBtn = $('button[type="submit"]');
        $submitBtn.prop('disabled', true).text('Registrando...');

        // 🚀 Enviar venta al endpoint correcto
        $.ajax({
            url: 'http://localhost:8080/api/sales/create',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(saleData),
            success: function (response) {
                alert('✅ Venta registrada correctamente');

                // ✅ Abrir ventana con detalle de la venta
                openSaleDetailWindow(response);

                // ✅ Actualizar stock localmente
                const $option = $productSelect.find(`option[value="${productId}"]`);
                const currentStock = $option.data('stock');
                const newStock = currentStock - quantity;

                if (newStock <= 0) {
                    $option.remove();
                } else {
                    $option.data('stock', newStock)
                           .text($option.text().replace(/Stock: \d+/, `Stock: ${newStock}`));
                }

                // Resetear formulario
                $productSelect.val('');
                $('#quantity').val('');
                $('#price').val('');
            },
            error: function (xhr) {
                let errorMsg = 'Error al registrar la venta.';
                if (xhr.responseJSON?.message) {
                    errorMsg = xhr.responseJSON.message;
                }
                alert('❌ ' + errorMsg);
            },
            complete: function () {
                $submitBtn.prop('disabled', false).text('Registrar Venta');
            }
        });
    });

    // ✅ Función para abrir ventana de detalle
    function openSaleDetailWindow(sale) {
        const ventaHtml = `
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <title>Detalle de Venta #${sale.id}</title>
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
                <style>
                    body { font-family: 'Segoe UI', sans-serif; background: #f8f9fa; }
                    .header { background: #0d6efd; color: white; border-radius: 8px; padding: 15px; text-align: center; }
                    .total { font-weight: bold; font-size: 1.3rem; color: #0d6efd; }
                    .footer { margin-top: 30px; text-align: center; font-size: 0.9rem; color: #6c757d; }
                </style>
            </head>
            <body class="p-4">
                <div class="header mb-4">
                    <h3>Distribuidora La Dorada</h3>
                    <p><strong>Venta #${sale.id}</strong> | ${new Date(sale.date).toLocaleString('es-CO')}</p>
                </div>

                <div class="card mb-4">
                    <div class="card-header bg-secondary text-white">Cliente</div>
                    <div class="card-body">
                        <p><strong>Nombre:</strong> ${sale.clientName}</p>
                        <p><strong>Teléfono:</strong> ${sale.clientPhone}</p>
                        <p><strong>Dirección:</strong> ${sale.clientAddress}</p>
                    </div>
                </div>

                <div class="card mb-4">
                    <div class="card-header bg-primary text-white">Productos</div>
                    <div class="table-responsive">
                        <table class="table table-bordered">
                            <thead class="table-light">
                                <tr>
                                    <th>Producto</th>
                                    <th>Modelo</th>
                                    <th>Cant.</th>
                                    <th>P. Unit.</th>
                                    <th>Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${sale.details.map(d => `
                                    <tr> 
                                        <td>${d.productName}</td>
                                        <td>${d.productModel}</td>
                                        <td>${d.quantity}</td>
                                        <td>$${d.unitPrice.toLocaleString('es-CO')}</td>
                                        <td>$${d.subtotal.toLocaleString('es-CO')}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="text-end total">
                    Total: $${sale.total.toLocaleString('es-CO')} COP
                </div>

                <div class="footer">
                    <button onclick="window.print()" class="btn btn-outline-primary btn-sm">🖨️ Imprimir</button>
                </div>
            </body>
            </html>
        `;

        const win = window.open('', '_blank', 'width=800,height=600');
        win.document.write(ventaHtml);
        win.document.close();
    }

    // Eventos para botones
    $('#btnRefreshDashboard').on('click', function() {
        // Recargar datos
        location.reload();
    });

    $('#btnCancelSale').on('click', function() {
        // Limpiar formulario
        $('#saleForm')[0].reset();
        $('#date').val(today);
        $productSelect.val('');
        $('#quantity').val('1');
        $('#price').val('');
    });

    // Botones de navegación
    $('#btnNewSaleFromSalesTab').on('click', function() {
        // Cambiar a la pestaña de dashboard
        $('#dashboard-tab').click();
    });

    $('#btnNewClient').on('click', function() {
        // Redirigir a la página de clientes
        window.location.href = '../seller/clients.html';
    });

    $('#btnNewProduct').on('click', function() {
        // Redirigir a la página de productos
        window.location.href = '../seller/products.html';
    });

    // Botones de búsqueda
    $('#btnSearchSales').on('click', function() {
        // Implementar búsqueda de ventas
        const query = $('#sales-search').val();
        alert('Buscando ventas por: ' + query);
    });

    $('#btnSearchProducts').on('click', function() {
        // Implementar búsqueda de productos
        const query = $('#products-search').val();
        alert('Buscando productos por: ' + query);
    });

    $('#btnSearchClients').on('click', function() {
        // Implementar búsqueda de clientes
        const query = $('#clients-search').val();
        alert('Buscando clientes por: ' + query);
    });
});