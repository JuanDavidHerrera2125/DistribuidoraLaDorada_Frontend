$(document).ready(function () {
    console.log("✅ salesDashboard.js cargado");

    let client = null;
    let today = new Date().toISOString().split('T')[0];
    $('#date').val(today);

    // 🔑 Función para obtener headers de autenticación
    function getAuthHeaders() {
        const token = localStorage.getItem('authToken');
        if (!token) {
            alert('Debes iniciar sesión para acceder a esta página');
            window.location.href = '../../login.html';
            return null;
        }
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    }

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
        if (!window.location.pathname.includes('clients.html')) {
            alert('No hay cliente seleccionado. Por favor, selecciona un cliente.');
        }
    }

    // 🔽 Cargar productos con stock > 0
    const $productSelect = $('#product');
    $productSelect.empty().append('<option value="">Cargando productos...</option>');

    const headers = getAuthHeaders();
    if (!headers) return;

    $.ajax({
        url: 'http://localhost:8080/api/products/with-stock',
        method: 'GET',
        headers: headers,
        success: function (products) {
            $productSelect.empty().append('<option value="">Seleccione un producto</option>');

            products.forEach(function (product) {
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
        },
        error: function () {
            $productSelect.empty().append('<option value="">Error al cargar productos</option>');
        }
    });

    // 🔄 Actualizar precio y cantidad
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

    // 🔒 Bloquear teclas no deseadas
    $('#quantity').on('keydown', function (e) {
        if (['-', 'e', 'E', '+', '.', ','].includes(e.key)) {
            e.preventDefault();
        }
    });

    // 📝 Validar cantidad
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

    // ======================
    // Función para actualizar Stats Cards y Info Rápida
    // ======================
    function updateDashboardStats() {
        const headers = getAuthHeaders();
        if (!headers) return;

        // 1️⃣ Ventas de hoy
        $.ajax({
            url: 'http://localhost:8080/api/sales/today-sales',
            method: 'GET',
            headers: headers,
            success: function(data) {
                $('#sales-count').text(data);
                $('#todays-sales').text(data);
            },
            error: function() {
                console.error('Error al cargar ventas de hoy');
                $('#sales-count').text('Error');
                $('#todays-sales').text('Error');
            }
        });

        // 2️⃣ Ingresos de hoy
        $.ajax({
            url: 'http://localhost:8080/api/sales/today-income',
            method: 'GET',
            headers: headers,
            success: function(data) {
                $('#revenue-total').text(`$${data.toLocaleString('es-CO')} COP`);
            },
            error: function() {
                console.error('Error al cargar ingresos de hoy');
                $('#revenue-total').text('$0 COP');
            }
        });

        // 3️⃣ Clientes registrados
        $.ajax({
            url: 'http://localhost:8080/api/sales/clients-count',
            method: 'GET',
            headers: headers,
            success: function(data) {
                $('#clients-count').text(data);
                $('#registered-clients').text(data);
            },
            error: function() {
                console.error('Error al cargar clientes');
                $('#clients-count').text('Error');
                $('#registered-clients').text('Error');
            }
        });

        // 4️⃣ Productos activos
        $.ajax({
            url: 'http://localhost:8080/api/sales/products-count',
            method: 'GET',
            headers: headers,
            success: function(data) {
                $('#products-count').text(data);
                $('#active-products').text(data);
            },
            error: function() {
                console.error('Error al cargar productos activos');
                $('#products-count').text('Error');
                $('#active-products').text('Error');
            }
        });

        // 5️⃣ Información Rápida (stock, etc.)
        $.ajax({
            url: 'http://localhost:8080/api/sales/quick-info',
            method: 'GET',
            headers: headers,
            success: function(data) {
                $('#stock-count').text(data.stockDisponible || 0);
                $('#active-products').text(data.productosActivos || 0);
                $('#registered-clients').text(data.clientesRegistrados || 0);
                $('#todays-sales').text(data.ventasDelDia || 0);
                // Opcional: actualizar ingresos aquí también
                $('#revenue-total').text(`$${(data.ingresosDelDia || 0).toLocaleString('es-CO')} COP`);
            },
            error: function() {
                console.error('Error al cargar información rápida');
                $('#stock-count').text('Error');
            }
        });
    }

    // Ejecutar al cargar la página
    updateDashboardStats();

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

        // 🚀 AJAX con token
        $.ajax({
            url: 'http://localhost:8080/api/sales/create',
            method: 'POST',
            headers: headers,
            contentType: 'application/json',
            data: JSON.stringify(saleData),
            success: function (response) {
                alert('✅ Venta registrada correctamente');
                openSaleDetailWindow(response);

                const $option = $productSelect.find(`option[value="${productId}"]`);
                const currentStock = $option.data('stock');
                const newStock = currentStock - quantity;

                if (newStock <= 0) {
                    $option.remove();
                } else {
                    $option.data('stock', newStock)
                           .text($option.text().replace(/Stock: \d+/, `Stock: ${newStock}`));
                }

                $productSelect.val('');
                $('#quantity').val('');
                $('#price').val('');

                // Actualizar Stats después de la venta
                updateDashboardStats();
            },
            error: function (xhr) {
                let errorMsg = 'Error al registrar la venta.';
                if (xhr.responseJSON?.message) {
                    errorMsg = xhr.responseJSON.message;
                }
                if(xhr.status === 401) {
                    alert('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
                    window.location.href = '../../login.html';
                } else {
                    alert('❌ ' + errorMsg);
                }
            },
            complete: function () {
                $submitBtn.prop('disabled', false).text('Registrar Venta');
            }
        });
    });
function openSaleDetailWindow(sale) {
    // 🛑 Validar que sale exista
    if (!sale) {
        alert("Error: Datos de venta no disponibles.");
        return;
    }

    // 🛑 Asegurar formato de fecha LOCALDATETIME -> cadena
    const fechaVenta = sale.date
        ? new Date(sale.date).toLocaleString('es-CO', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          })
        : "Sin fecha";

    // 🛑 Render seguro de totales
    const total = sale.total
        ? Number(sale.total).toLocaleString('es-CO')
        : "0";

    // ✅ Construir el detalle del producto desde los datos actuales del formulario
    const productId = $('#product').val();
    const productName = $('#product option:selected').data('name') || '';
    const quantity = parseInt($('#quantity').val(), 10) || 0;
    const unitPrice = parseFloat($('#price').val()) || 0;
    const subtotal = quantity * unitPrice;

    // ✅ Crear un objeto "detalle" temporal para mostrar
    const details = [
        {
            productName: productName.split(' - ')[0] || '', // Nombre sin modelo
            productModel: productName.split(' - ')[1] || '', // Modelo
            quantity: quantity,
            unitPrice: unitPrice,
            subtotal: subtotal
        }
    ];

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
                <p><strong>Venta #${sale.id}</strong> | ${fechaVenta}</p>
            </div>

            <div class="card mb-4">
                <div class="card-header bg-secondary text-white">Cliente</div>
                <div class="card-body">
                    <p><strong>Nombre:</strong> ${sale.clientName ?? "No registrado"}</p>
                    <p><strong>Teléfono:</strong> ${sale.clientPhone ?? "No registrado"}</p>
                    <p><strong>Dirección:</strong> ${sale.clientAddress ?? "No registrada"}</p>
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
                            ${details.length === 0 
                                ? `<tr><td colspan="5" class="text-center text-muted">Sin productos registrados</td></tr>` 
                                : details.map(d => `
                                    <tr> 
                                        <td>${d.productName ?? ""}</td>
                                        <td>${d.productModel ?? ""}</td>
                                        <td>${d.quantity ?? 0}</td>
                                        <td>$${Number(d.unitPrice ?? 0).toLocaleString('es-CO')}</td>
                                        <td>$${Number(d.subtotal ?? 0).toLocaleString('es-CO')}</td>
                                    </tr>
                                `).join('')
                            }
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="text-end total">
                Total: $${total} COP
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


    // Botones de dashboard
    $('#btnRefreshDashboard').on('click', function() { updateDashboardStats(); });
    $('#btnCancelSale').on('click', function() { 
        $('#saleForm')[0].reset(); 
        $('#date').val(today); 
        $productSelect.val(''); 
        $('#quantity').val('1'); 
        $('#price').val('');
    });

    $('#btnNewSaleFromSalesTab').on('click', function() { $('#dashboard-tab').click(); });
    $('#btnNewClient').on('click', function() { window.location.href = '../seller/clients.html'; });
    $('#btnNewProduct').on('click', function() { window.location.href = '../seller/products.html'; });

    // Búsquedas
    $('#btnSearchSales').on('click', function() { 
        const query = $('#sales-search').val(); 
        alert('Buscando ventas por: ' + query); 
    });
    $('#btnSearchProducts').on('click', function() { 
        const query = $('#products-search').val(); 
        alert('Buscando productos por: ' + query); 
    });
    $('#btnSearchClients').on('click', function() { 
        const query = $('#clients-search').val(); 
        alert('Buscando clientes por: ' + query); 
    });
});