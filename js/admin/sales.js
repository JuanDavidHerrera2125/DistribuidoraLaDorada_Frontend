$(document).ready(function () {
    console.log("✅ reports.js cargado");

    // 🔧 FUNCIÓN PARA ACTUALIZAR SIDEBAR SEGÚN PÁGINA ACTUAL
    function updateSidebarActiveItem() {
        const currentPath = window.location.pathname;
        console.log("📍 Ruta actual:", currentPath);
        
        $('.sidebar .nav-link').removeClass('active');
        $('.sidebar .nav-item').removeClass('active');
        
        if (currentPath.includes('dashboard.html')) {
            $('#sidebarDashboard').addClass('active');
            console.log("✅ Sidebar: Dashboard activo");
        } else if (currentPath.includes('products.html')) {
            $('#sidebarProducts').addClass('active');
            console.log("✅ Sidebar: Productos activo");
        } else if (currentPath.includes('clients.html')) {
            $('#sidebarClients').addClass('active');
            console.log("✅ Sidebar: Clientes activo");
        } else if (currentPath.includes('sales.html')) {
            $('#sidebarSales').addClass('active');
            console.log("✅ Sidebar: Ventas activo");
        } else if (currentPath.includes('stock.html')) {
            $('#sidebarStock').addClass('active');
            console.log("✅ Sidebar: Inventario activo");
        } else if (currentPath.includes('settings.html')) {
            $('#sidebarSettings').addClass('active');
            console.log("✅ Sidebar: Configuración activo");
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
            if ($('#sidebarReports').length > 0) {
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
            $('.card-body').css('padding', '10px');
            $('.main-content').css('padding', '10px');
            $('body').css('overflow-y', 'auto');
        } else {
            $('.card-body').css('padding', '20px');
            $('.main-content').css('padding', '20px');
        }
    }

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

    // Verificar autenticación al cargar la página
    const authHeaders = getAuthHeaders();
    if (!authHeaders) return;

    // Ajustar responsive al cargar y al redimensionar
    adjustResponsive();
    $(window).on('resize', adjustResponsive);

    // Ejecutar después de que sidebar cargue
    waitForSidebar(() => {
        updateSidebarActiveItem();
        console.log("✅ Sidebar cargado y actualizado");
    });

    const $tableBody = $('#salesTableBody');
    const $spinner = `
        <tr>
            <td colspan="9" class="text-center text-muted py-5">
                <div class="spinner-border text-light me-2" role="status" style="width: 20px; height: 20px;"></div>
                Cargando ventas...
            </td>
        </tr>
    `;

    $tableBody.empty().append($spinner);

    // Cargar ventas
    loadSales();

    function loadSales() {
        $.ajax({
            url: 'http://3.17.146.31:8080/api/sales',
            type: 'GET',
            headers: authHeaders,
            success: function (sales) {
                $tableBody.empty();

                if (!sales || sales.length === 0) {
                    $tableBody.append('<tr><td colspan="9" class="text-center text-muted">No hay ventas registradas.</td></tr>');
                    return;
                }

                sales.forEach(sale => {
                    const clientName = sale.clientName || 'Cliente no disponible';
                    const detail = (sale.details && sale.details.length > 0) ? sale.details[0] : null;
                    const productName = detail ? `${detail.productName} - ${detail.productModel}` : 'Producto no disponible';
                    const quantity = detail ? detail.quantity : 0;
                    const price = detail ? detail.unitPrice : 0;
                    const total = sale.total || (quantity * price);
                    const date = sale.date ? new Date(sale.date).toLocaleDateString('es-CO') : 'Sin fecha';
                    const status = sale.status || 'ACTIVE';
                    const isCancelled = status === 'CANCELLED';

                    const row = `
                        <tr ${isCancelled ? 'class="table-secondary"' : ''}>
                            <td>${sale.id}</td>
                            <td class="text-start">${escapeHtml(clientName)}</td>
                            <td class="text-start">${escapeHtml(productName)}</td>
                            <td>${quantity}</td>
                            <td>$${price.toLocaleString('es-CO')}</td>
                            <td>$${total.toLocaleString('es-CO')}</td>
                            <td>${date}</td>
                            <td>
                                <span class="badge ${isCancelled ? 'bg-danger' : 'bg-success'}">
                                    ${isCancelled ? 'Cancelada' : 'Activa'}
                                </span>
                            </td>
                            <td>
                                ${isCancelled 
                                    ? '<button class="btn btn-sm btn-secondary" disabled>Cancelada</button>'
                                    : `<button class="btn btn-sm btn-danger btn-cancel-sale" 
                                            data-id="${sale.id}" 
                                            data-product="${escapeHtml(productName)}" 
                                            data-quantity="${quantity}">
                                        Cancelar Venta
                                    </button>`
                                }
                            </td>
                        </tr>
                    `;
                    $tableBody.append(row);
                });
            },
            error: function (xhr) {
                console.error('Error al cargar ventas:', xhr);
                if (xhr.status === 401) {
                    alert('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
                    window.location.href = '../../login.html';
                } else {
                    $tableBody.empty().append(`
                        <tr>
                            <td colspan="9" class="text-center text-danger py-3">
                                Error al cargar las ventas: ${xhr.status === 0 ? 'Servidor no disponible' : xhr.statusText}
                            </td>
                        </tr>
                    `);
                }
            }
        });
    }

    // Manejar cancelación de venta
    $tableBody.on('click', '.btn-cancel-sale', function () {
        const saleId = $(this).data('id');
        const productName = $(this).data('product');
        const quantity = $(this).data('quantity');

        if (!confirm(`¿Está seguro de cancelar la venta #${saleId} por ${quantity} unidades de "${productName}"?`)) {
            return;
        }

        $.ajax({
            url: `http://3.17.146.31:8080/api/sales/cancel/${saleId}`,
            type: 'POST',
            headers: authHeaders,
            success: function () {
                alert(`✅ Venta #${saleId} cancelada y stock devuelto correctamente.`);
                loadSales();
            },
            error: function (xhr) {
                console.error('Error al cancelar venta:', xhr);
                if (xhr.status === 401) {
                    alert('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
                    window.location.href = '../../login.html';
                } else {
                    alert('❌ No se pudo cancelar la venta: ' + (xhr.responseJSON?.message || 'Error desconocido'));
                }
            }
        });
    });

    function parseProductName(fullName) {
        const parts = fullName.split(' - ');
        if (parts.length === 2) {
            return [parts[0].trim(), parts[1].trim()];
        }
        return [fullName.trim(), ''];
    }

    document.getElementById('btnLogout').addEventListener('click', () => {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = "../../login.html";
    });

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 👇 BOTÓN MENÚ PARA MÓVIL - ADMIN
    $('#menuToggle').on('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        $('.sidebar').toggleClass('show');
        if ($('.sidebar').hasClass('show')) {
            $('body').css('overflow', 'hidden');
        } else {
            $('body').css('overflow', 'auto');
        }
    });
    
    $(document).on('click', function(e) {
        if ($(window).width() <= 768) {
            if (!$('.sidebar').is(e.target) && 
                $('.sidebar').has(e.target).length === 0 && 
                !$('#menuToggle').is(e.target)) {
                $('.sidebar').removeClass('show');
                $('body').css('overflow', 'auto');
            }
        }
    });
    
    $('.sidebar').on('touchmove', function(e) {
        e.stopPropagation();
    });
    
    // 👇 FIX: Asegurar que la tabla sea scrollable en móvil
    function adjustTableResponsive() {
        if ($(window).width() < 768) {
            $('#salesTableContainer').css({
                'overflow-x': 'auto',
                'overflow-y': 'auto'
            });
            $('#salesTable').css('min-width', '100%');
        } else {
            $('#salesTableContainer').css({
                'overflow-x': 'hidden',
                'overflow-y': 'auto'
            });
            $('#salesTable').css('min-width', 'auto');
        }
    }

    adjustTableResponsive();
    $(window).on('resize', adjustTableResponsive);
    
    $('#salesTableContainer').on('scroll', function() {
        if ($(window).width() < 768) {
            $('footer').css('position', 'static');
        }
    });
    
    setTimeout(function() {
        if ($(window).width() < 768) {
            $('#salesTableContainer').scrollLeft(0);
        }
    }, 100);
});