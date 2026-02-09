$(document).ready(function () {
    console.log("✅ salesDashboard.js cargado");

    // 🔧 FUNCIÓN PARA ACTUALIZAR SIDEBAR SEGÚN PÁGINA ACTUAL
    function updateSidebarActiveItem() {
        const currentPath = window.location.pathname;
        console.log("📍 Ruta actual:", currentPath);
        
        $('.sidebar .nav-link').removeClass('active');
        $('.sidebar .nav-item').removeClass('active');
        
        if (currentPath.includes('clients.html')) {
            $('#sidebarClients').addClass('active');
            console.log("✅ Sidebar: Clientes activo");
        } else if (currentPath.includes('salesDashboard.html')) {
            $('#sidebarDashboard').addClass('active');
            console.log("✅ Sidebar: Dashboard activo");
        } else if (currentPath.includes('sales.html')) {
            $('#sidebarSales').addClass('active');
            console.log("✅ Sidebar: Ventas activo");
        } else if (currentPath.includes('products.html')) {
            $('#sidebarProducts').addClass('active');
            console.log("✅ Sidebar: Productos activo");
        } else if (currentPath.includes('reports.html')) {
            $('#sidebarReports').addClass('active');
            console.log("✅ Sidebar: Reportes activo");
        }
    }

    // 🔧 ESPERAR A QUE EL SIDEBAR CARGUE COMPLETAMENTE
    function waitForSidebar(callback) {
        let attempts = 0;
        const maxAttempts = 50;
        const checkInterval = setInterval(() => {
            if ($('#sidebarDashboard').length > 0) {
                clearInterval(checkInterval);
                callback();
            } else if (attempts >= maxAttempts) {
                clearInterval(checkInterval);
                console.warn("⚠️ Sidebar no cargó después de 5 segundos");
                callback();
            }
            attempts++;
        }, 100);
    }

    // 🔧 Función para ajustar responsive
    function adjustResponsive() {
        const width = $(window).width();
        
        if (width < 768) {
            $('.card').css('margin-bottom', '10px');
            $('.stat-card').css('margin-bottom', '10px');
            $('.form-group').css('margin-bottom', '10px');
            $('#saleForm').css('padding', '10px');
            $('.main-content').css('padding', '10px');
            // 👇 FIX: Asegurar scroll en móvil
            $('body').css('overflow-y', 'auto');
        } else {
            $('.card').css('margin-bottom', '20px');
            $('.stat-card').css('margin-bottom', '15px');
            $('.form-group').css('margin-bottom', '15px');
            $('#saleForm').css('padding', '20px');
            $('.main-content').css('padding', '20px');
        }
    }

    // Ejecutar después de que sidebar cargue
    waitForSidebar(() => {
        updateSidebarActiveItem();
        console.log("✅ Sidebar cargado y actualizado");
    });

    adjustResponsive();
    $(window).on('resize', adjustResponsive);

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

    // ✅ Validar que haya cliente
    if (!client || !client.id || !client.name) {
        console.error("❌ Cliente inválido o no encontrado:", client);
        
        if (!window.location.pathname.includes('clients.html')) {
            alert('⚠️ No hay cliente seleccionado. Por favor, selecciona un cliente.');
            setTimeout(() => {
                window.location.href = 'clients.html';
            }, 1500);
        }
        return; 
    }

    console.log("✅ Cliente válido cargado:", client.name);

    // 🔽 Cargar productos con stock > 0
    const $productSelect = $('#product');
    $productSelect.empty().append('<option value="">Cargando productos...</option>');

    const headers = getAuthHeaders();
    if (!headers) return;

    $.ajax({
        url: 'http://3.17.146.31:8080/api/products/with-stock',
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
            url: 'http://3.17.146.31:8080/api/sales/today-sales',
            method: 'GET',
            headers: headers,
            success: function(data) {
                $('#sales-count').text(data);
                $('#todays-sales').text(data);
            },
            error: function() {
                $('#sales-count').text('0');
                $('#todays-sales').text('0');
            }
        });

        // 2️⃣ Ingresos de hoy
        $.ajax({
            url: 'http://3.17.146.31:8080/api/sales/today-income',
            method: 'GET',
            headers: headers,
            success: function(data) {
                $('#revenue-total').text(`$${data.toLocaleString('es-CO')} COP`);
            },
            error: function() {
                $('#revenue-total').text('$0 COP');
            }
        });

        // 3️⃣ Clientes registrados
        $.ajax({
            url: 'http://3.17.146.31:8080/api/sales/clients-count',
            method: 'GET',
            headers: headers,
            success: function(data) {
                $('#clients-count').text(data);
                $('#registered-clients').text(data);
            },
            error: function() {
                $('#clients-count').text('0');
                $('#registered-clients').text('0');
            }
        });

        // 4️⃣ Productos activos
        $.ajax({
            url: 'http://3.17.146.31:8080/api/sales/products-count',
            method: 'GET',
            headers: headers,
            success: function(data) {
                $('#products-count').text(data);
                $('#active-products').text(data);
            },
            error: function() {
                $('#products-count').text('0');
                $('#active-products').text('0');
            }
        });

        // 5️⃣ Información Rápida (stock, etc.)
        $.ajax({
            url: 'http://3.17.146.31:8080/api/sales/quick-info',
            method: 'GET',
            headers: headers,
            success: function(data) {
                $('#stock-count').text(data.stockDisponible || 0);
                $('#active-products').text(data.productosActivos || 0);
                $('#registered-clients').text(data.clientesRegistrados || 0);
                $('#todays-sales').text(data.ventasDelDia || 0);
                $('#revenue-total').text(`$${(data.ingresosDelDia || 0).toLocaleString('es-CO')} COP`);
            },
            error: function() {
                console.error('Error al cargar información rápida');
            }
        });

        loadRecentSales();
    }

    function loadRecentSales() {
        const headers = getAuthHeaders();
        if (!headers) return;

        $.ajax({
            url: 'http://3.17.146.31:8080/api/sales/recent',
            method: 'GET',
            headers: headers,
            success: function(sales) {
                const $list = $('#recent-sales-list');
                $list.empty();

                if (!sales || sales.length === 0) {
                    $list.html('<p class="text-center text-muted">No hay ventas recientes</p>');
                    return;
                }

                sales.slice(0, 10).forEach(sale => {
                    const date = sale.date ? new Date(sale.date).toLocaleDateString('es-CO') : 'N/A';
                    const total = sale.total ? `$${sale.total.toLocaleString('es-CO')}` : 'N/A';
                    
                    const saleItem = `
                        <div class="sale-item">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <strong>${sale.clientName || 'N/A'}</strong><br>
                                    <small class="text-muted">${date}</small>
                                </div>
                                <div class="text-end">
                                    <strong class="text-success">${total}</strong><br>
                                    <small class="badge ${sale.status === 'CANCELLED' ? 'bg-danger' : 'bg-success'}">
                                        ${sale.status === 'CANCELLED' ? 'Cancelada' : 'Completada'}
                                    </small>
                                </div>
                            </div>
                        </div>
                    `;
                    $list.append(saleItem);
                });
            },
            error: function() {
                $('#recent-sales-list').html('<p class="text-center text-muted">Error al cargar ventas</p>');
            }
        });
    }

    // Ejecutar al cargar la página
    updateDashboardStats();

    // ✅ Manejo del formulario de venta (CORREGIDO)
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
        $submitBtn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin me-1"></i> Registrando...');

        $.ajax({
            url: 'http://3.17.146.31:8080/api/sales/create',
            method: 'POST',
            headers: headers,
            contentType: 'application/json',
            data: JSON.stringify(saleData), // <-- FIX: Se agregó "data:"
            success: function (response) {
                alert('✅ Venta registrada correctamente');
                openSaleDetailWindow(response);

                // 👇 FIX: Actualización de stock corregida
                const $option = $productSelect.find(`option[value="${productId}"]`);
                if ($option.length > 0) {
                    const currentStock = parseInt($option.data('stock'), 10);
                    const newStock = currentStock - quantity;

                    if (newStock <= 0) {
                        $option.remove();
                    } else {
                        $option.data('stock', newStock).attr('data-stock', newStock);
                        // Reemplazar el texto del Stock dinámicamente
                        const updatedText = $option.text().replace(/Stock: \d+/, `Stock: ${newStock}`);
                        $option.text(updatedText);
                    }
                }

                $productSelect.val('');
                $('#quantity').val('1');
                $('#price').val('');

                updateDashboardStats();
            },
            error: function (xhr) {
                let errorMsg = 'Error al registrar la venta.';
                if (xhr.responseJSON?.message) errorMsg = xhr.responseJSON.message;
                if(xhr.status === 401) {
                    alert('Tu sesión ha expirado.');
                    window.location.href = '../../login.html';
                } else {
                    alert('❌ ' + errorMsg);
                }
            },
            complete: function () {
                $submitBtn.prop('disabled', false).html('<i class="fas fa-save me-1"></i> Registrar Venta');
            }
        });
    });

    function openSaleDetailWindow(sale) {
        if (!sale) return;

        const fechaVenta = sale.date ? new Date(sale.date).toLocaleString('es-CO') : "Sin fecha";
        const total = sale.total ? Number(sale.total).toLocaleString('es-CO') : "0";

        // Datos del producto actual para el detalle
        const productName = $('#product option:selected').data('name') || '';
        const quantity = parseInt($('#quantity').val(), 10) || 0;
        const unitPrice = parseFloat($('#price').val()) || 0;
        const subtotal = quantity * unitPrice;

        const details = [{
            productName: productName.split(' - ')[0] || '',
            productModel: productName.split(' - ')[1] || '',
            quantity: quantity,
            unitPrice: unitPrice,
            subtotal: subtotal
        }];

        const ventaHtml = `
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <title>Detalle de Venta #${sale.id}</title>
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
                <style>
                    body { font-family: 'Segoe UI', sans-serif; padding: 20px; }
                    .header { background: #2c3e50; color: white; padding: 15px; text-align: center; border-radius: 8px; margin-bottom: 20px; }
                    .total { font-weight: bold; font-size: 1.3rem; color: #2c3e50; text-align: right; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h3>Distribuidora La Dorada</h3>
                    <p>Venta #${sale.id} | ${fechaVenta}</p>
                </div>
                <div class="card mb-3">
                    <div class="card-header bg-light">Cliente</div>
                    <div class="card-body">
                        <p><strong>Nombre:</strong> ${sale.clientName ?? "N/A"}</p>
                        <p><strong>Teléfono:</strong> ${sale.clientPhone ?? "N/A"}</p>
                    </div>
                </div>
                <table class="table table-bordered">
                    <thead class="table-dark">
                        <tr><th>Producto</th><th>Modelo</th><th>Cant.</th><th>P. Unit.</th><th>Subtotal</th></tr>
                    </thead>
                    <tbody>
                        ${details.map(d => `
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
                <div class="total">Total: $${total} COP</div>
                <div class="text-center mt-4"><button onclick="window.print()" class="btn btn-primary">🖨️ Imprimir</button></div>
            </body>
            </html>
        `;

        const win = window.open('', '_blank', 'width=800,height=600');
        win.document.write(ventaHtml);
        win.document.close();
    }

    // Botones de dashboard y navegación
    $('#btnRefreshDashboard').on('click', function() { 
        const $btn = $(this);
        $btn.html('<i class="fas fa-spinner fa-spin me-1"></i>...');
        updateDashboardStats();
        setTimeout(() => $btn.html('<i class="fas fa-sync me-1"></i> Actualizar'), 1000);
    });
    
    $('#btnCancelSale').on('click', function() { 
        $('#saleForm')[0].reset(); 
        $('#date').val(today); 
        $productSelect.val(''); 
        $('#quantity').val('1'); 
        $('#price').val('');
    });

    $('#btnNewSaleFromSalesTab').on('click', function() { $('#dashboard-tab').click(); });
    $('#btnNewClient').on('click', function() { window.location.href = 'clients.html'; });
    $('#btnNewProduct').on('click', function() { window.location.href = 'products.html'; });

    // Búsquedas (Alertas informativas)
    $('#btnSearchSales').on('click', function() { alert('Buscando ventas por: ' + $('#sales-search').val()); });
    $('#btnSearchProducts').on('click', function() { alert('Buscando productos por: ' + $('#products-search').val()); });
    $('#btnSearchClients').on('click', function() { alert('Buscando clientes por: ' + $('#clients-search').val()); });

    // 👇 MENÚ MÓVIL
    $('#menuToggle').on('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        $('.sidebar').toggleClass('show');
        $('body').css('overflow', $('.sidebar').hasClass('show') ? 'hidden' : 'auto');
    });
    
    $(document).on('click', function(e) {
        if ($(window).width() <= 768) {
            if (!$('.sidebar').is(e.target) && $('.sidebar').has(e.target).length === 0 && !$('#menuToggle').is(e.target)) {
                $('.sidebar').removeClass('show');
                $('body').css('overflow', 'auto');
            }
        }
    });
});