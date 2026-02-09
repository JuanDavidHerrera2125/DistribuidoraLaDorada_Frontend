$(document).ready(function () {
    console.log("✅ products.js cargado");

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
            if ($('#sidebarProducts').length > 0) {
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

    // 🔑 Verificar autenticación INMEDIATAMENTE
    const token = localStorage.getItem('authToken');
    if (!token) {
        alert('Debes iniciar sesión para acceder a esta página');
        window.location.href = '/login.html';
        return; // ¡Detener toda ejecución!
    }

    const AUTH_HEADERS = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    // Ajustar responsive al cargar y al redimensionar
    adjustResponsive();
    $(window).on('resize', adjustResponsive);

    // Ejecutar después de que sidebar cargue
    waitForSidebar(() => {
        updateSidebarActiveItem();
        console.log("✅ Sidebar cargado y actualizado");
    });

    // ✅ Resto del código SOLO si hay token
    const today = new Date().toISOString().split('T')[0];
    $('#registrationDate').val(today);

    const BASE_PRICES = {
        "Silla Mesedora": 100000,
        "Silla Fija": 90000,
        "Silla Barra": 110000,
        "Silla Sala": 95000,
        "Silla Huevo": 85000,
        "Silla Columpio": 105000,
        "Silla Pequeña": 75000,
        "Silla Brazona": 120000
    };

    const DESIGN_PRICES = {
        "Wuayú": 80000,
        "Canasta": 60000,
        "Sencilla": 40000,
        "Extra Grande": 100000,
        "Fútbol": 50000,
        "Imagen": 75000
    };

    $('#nameSelect').on('change', function () {
        const show = $(this).val() === 'Otro';
        $('#customNameContainer').toggle(show);
        updateUnitPrice();
    });

    $('#model').on('change', updateUnitPrice);
    $('#customName').on('input', function () {
        if ($('#nameSelect').val() === 'Otro') updateUnitPrice();
    });

    function updateUnitPrice() {
        let name = $('#nameSelect').val();
        if (name === 'Otro') name = $('#customName').val().trim();
        const model = $('#model').val();

        const base = BASE_PRICES[name] || 0;
        const design = DESIGN_PRICES[model] || 0;
        $('#unitPrice').val(base + design || '');
    }

    let isSubmitting = false;
    $('#productForm').on('submit', function (e) {
        e.preventDefault();
        if (isSubmitting) return;
        isSubmitting = true;

        // Validaciones (igual que antes)
        let name = $('#nameSelect').val();
        if (name === 'Otro') {
            name = $('#customName').val().trim();
            if (!name) { alert('Ingrese nombre personalizado'); isSubmitting = false; return; }
        } else if (!name) {
            alert('Seleccione tipo de silla'); isSubmitting = false; return;
        }

        const unitPrice = parseFloat($('#unitPrice').val());
        const model = $('#model').val();
        const initialStock = parseInt($('#initialStock').val(), 10);

        if (isNaN(unitPrice) || unitPrice <= 0) { alert('Precio inválido'); isSubmitting = false; return; }
        if (!model) { alert('Seleccione diseño'); isSubmitting = false; return; }
        if (isNaN(initialStock) || initialStock < 0) { alert('Stock inválido'); isSubmitting = false; return; }

        const productData = {
            name,
            description: $('#description').val().trim(),
            unitPrice,
            model,
            registrationDate: $('#registrationDate').val(),
            active: $('#active').val() === 'true',
            initialStock
        };

        $.ajax({
            url: 'http://3.17.146.31:8080/api/products/create-with-stock',
            type: 'POST',
            headers: AUTH_HEADERS,
            data: JSON.stringify(productData), // ✅ CORREGIDO: "data" en minúscula
            success: function (product) {
                alert(`✅ Producto "${product.name}" registrado`);
                window.location.href = 'stock.html';
            },
            error: function (xhr) {
                console.error('Error:', xhr);
                alert('❌ Error: ' + (xhr.responseJSON?.message || 'No autorizado. Inicia sesión nuevamente.'));

                // Si es 401, limpiar y redirigir
                if (xhr.status === 401) {
                    localStorage.removeItem('authToken');
                    window.location.href = '/login.html';
                }
            },
            complete: () => { isSubmitting = false; }
        });
    });

    // Cargar tabla de stock si existe
    if ($('#stockTable').length > 0) {
        loadStockTable();
    }

    function loadStockTable() {
        const $tbody = $('#stockTable tbody');
        $tbody.empty().append('<tr><td colspan="4" class="text-center">Cargando...</td></tr>');

        $.ajax({
            url: 'http://3.17.146.31:8080/api/products/with-stock',
            headers: AUTH_HEADERS,
            success: function (products) {
                $tbody.empty();
                if (!Array.isArray(products) || products.length === 0) {
                    $tbody.append('<tr><td colspan="4" class="text-center">Sin productos</td></tr>');
                    return;
                }

                const grouped = {};
                products.forEach(p => {
                    const key = `${p.name}__${p.model}`;
                    if (!grouped[key]) {
                        grouped[key] = { name: p.name, model: p.model, unitPrice: p.unitPrice, totalStock: 0 };
                    }
                    grouped[key].totalStock += (p.stock?.quantity || 0);
                });

                Object.values(grouped).forEach(p => {
                    $tbody.append(`
                        <tr>
                            <td>${escapeHtml(p.name)}</td>
                            <td class="text-center"><span class="badge bg-info">${escapeHtml(p.model)}</span></td>
                            <td class="text-center">$${(p.unitPrice).toLocaleString('es-CO')}</td>
                            <td class="text-center">${p.totalStock}</td>
                        </tr>
                    `);
                });
            },
            error: function (xhr) {
                $tbody.empty().append(`<tr><td colspan="4" class="text-center text-danger">Error: ${xhr.status}</td></tr>`);
                if (xhr.status === 401) {
                    localStorage.removeItem('authToken');
                    window.location.href = '/login.html';
                }
            }
        });
    }

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
});