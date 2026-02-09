$(document).ready(function () {
    console.log("✅ stock.js cargado");

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
            if ($('#sidebarStock').length > 0) {
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

    // 🔑 Verificar autenticación
    function getAuthHeaders() {
        const token = localStorage.getItem('authToken');
        if (!token) {
            alert('Debes iniciar sesión');
            window.location.href = '/login.html';
            return null;
        }
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    }

    // Cargar sidebar
    $("#sidebar").load("../../components/sidebar-admin.html");

    const $tbody = $('#stockTableBody');

    // Ajustar responsive al cargar y al redimensionar
    adjustResponsive();
    $(window).on('resize', adjustResponsive);

    // Ejecutar después de que sidebar cargue
    waitForSidebar(() => {
        updateSidebarActiveItem();
        console.log("✅ Sidebar cargado y actualizado");
    });

    // Función para cargar y agrupar stock
    function loadStock() {
        $tbody.empty().append(`
            <tr>
                <td colspan="4" class="text-center text-muted py-5">
                    <div class="spinner-border text-light me-2" role="status" style="width: 20px; height: 20px;"></div>
                    Cargando productos...
                </td>
            </tr>
        `);

        const headers = getAuthHeaders();
        if (!headers) return;

        $.ajax({
            url: 'http://3.17.146.31:8080/api/products/with-stock',
            type: 'GET',
            headers: headers,
            success: function (products) {
                $tbody.empty();
                if (!Array.isArray(products) || products.length === 0) {
                    $tbody.append(`
                        <tr>
                            <td colspan="4" class="text-center text-muted py-3">
                                No hay productos en el inventario.
                            </td>
                        </tr>
                    `);
                    return;
                }

                const grouped = {};
                products.forEach(p => {
                    const key = `${p.name}__${p.model}`;
                    if (!grouped[key]) {
                        grouped[key] = {
                            name: p.name,
                            model: p.model,
                            unitPrice: p.unitPrice,
                            totalStock: 0
                        };
                    }
                    grouped[key].totalStock += p.currentStock;
                });

                Object.values(grouped).forEach(item => {
                    $tbody.append(`
                        <tr>
                            <td class="text-start">${escapeHtml(item.name || '—')}</td>
                            <td class="text-center">
                                <span class="badge bg-info">${escapeHtml(item.model || '—')}</span>
                            </td>
                            <td class="text-center">$${(item.unitPrice || 0).toLocaleString('es-CO')}</td>
                            <td class="text-center">${item.totalStock}</td>
                        </tr>
                    `);
                });
            },
            error: function (xhr) {
                console.error('❌ Error al cargar stock:', xhr);
                $tbody.empty().append(`
                    <tr>
                        <td colspan="4" class="text-center text-danger py-3">
                            Error al cargar el inventario (${xhr.status})
                        </td>
                    </tr>
                `);
                if (xhr.status === 401) {
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('user');
                    window.location.href = '/login.html';
                }
            }
        });
    }

    function escapeHtml(text) {
        if (typeof text !== 'string') return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Cargar al iniciar
    loadStock();

    // Botón de refrescar
    $('#btnRefreshStock').on('click', loadStock);

    // Función global de logout
    window.logout = function() {
        const token = localStorage.getItem('authToken');
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        if (token) {
            $.ajax({
                url: 'http://3.17.146.31:8080/api/api/auth/logout',
                type: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            }).always(() => {
                window.location.href = '/login.html';
            });
        } else {
            window.location.href = '/login.html';
        }
    };

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
            $('#stockTableContainer').css({
                'overflow-x': 'auto',
                'overflow-y': 'auto'
            });
            $('#stockTable').css('min-width', '100%');
        } else {
            $('#stockTableContainer').css({
                'overflow-x': 'hidden',
                'overflow-y': 'auto'
            });
            $('#stockTable').css('min-width', 'auto');
        }
    }

    adjustTableResponsive();
    $(window).on('resize', adjustTableResponsive);
    
    $('#stockTableContainer').on('scroll', function() {
        if ($(window).width() < 768) {
            $('footer').css('position', 'static');
        }
    });
    
    setTimeout(function() {
        if ($(window).width() < 768) {
            $('#stockTableContainer').scrollLeft(0);
        }
    }, 100);
});