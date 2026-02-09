$(document).ready(function () {
    console.log("✅ sales.js cargado");

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
        const maxAttempts = 50; // 5 segundos máximo
        const checkInterval = setInterval(() => {
            // Verificar si el sidebar tiene los elementos necesarios
            if ($('#sidebarSales').length > 0 || $('#sidebarClients').length > 0) {
                clearInterval(checkInterval);
                callback();
            } else if (attempts >= maxAttempts) {
                clearInterval(checkInterval);
                console.warn("⚠️ Sidebar no cargó después de 5 segundos");
                callback(); // Ejecutar de todos modos
            }
            attempts++;
        }, 100);
    }

    // 🔧 Función para ajustar responsive
    function adjustResponsive() {
        const width = $(window).width();
        
        if (width < 768) {
            // Móvil: ajustar tabla
            $('#salesTable').addClass('table-responsive');
            $('.card-body').css('padding', '10px');
            $('.filter-section').addClass('flex-column');
            $('.filter-section .form-group').css('margin-bottom', '10px');
        } else {
            $('#salesTable').removeClass('table-responsive');
            $('.card-body').css('padding', '20px');
            $('.filter-section').removeClass('flex-column');
            $('.filter-section .form-group').css('margin-bottom', '0');
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

    const $tableBody = $('#salesTable tbody');

    // Mostrar spinner mientras carga
    const $spinner = `
        <tr>
            <td colspan="5" class="text-center text-muted py-4">
                <div class="spinner-border text-primary me-2" role="status" style="width: 20px; height: 20px;"></div>
                Cargando ventas...
            </td>
        </tr>
    `;
    $tableBody.html($spinner);

    // Botón de recargar
    $('#btnLoadSales').on('click', function () {
        loadSales();
    });

    // Cargar ventas
    function loadSales() {
        $.ajax({
            url: 'http://3.17.146.31:8080/api/sales',
            type: 'GET',
            headers: authHeaders,
            success: function (sales) {
                $tableBody.empty();

                if (!sales || sales.length === 0) {
                    $tableBody.append('<tr><td colspan="5" class="text-center text-muted">No hay ventas registradas.</td></tr>');
                    return;
                }

                sales.forEach(sale => {
                    const client = sale.clientName || "N/A";
                    const date = sale.date ? new Date(sale.date).toLocaleDateString('es-CO') : "N/A";
                    const total = sale.total != null ? `$${sale.total.toLocaleString('es-CO')}` : "N/A";
                    const status = sale.status || "N/A";

                    const row = `
                        <tr>
                            <td>${sale.id}</td>
                            <td class="text-start">${escapeHtml(client)}</td>
                            <td>${date}</td>
                            <td>${total}</td>
                            <td>
                                <span class="badge ${status === 'CANCELLED' ? 'bg-danger' : 'bg-success'}">
                                    ${status === 'CANCELLED' ? 'Cancelada' : 'Completada'}
                                </span>
                            </td>
                        </tr>
                    `;
                    $tableBody.append(row);
                });
                
                // Aplicar filtros después de cargar los datos
                filterTable();
            },
            error: function (xhr) {
                console.error('Error al cargar ventas:', xhr);
                if (xhr.status === 401) {
                    alert('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
                    window.location.href = '../../login.html';
                } else {
                    $tableBody.empty().append(`
                        <tr>
                            <td colspan="5" class="text-center text-danger py-3">
                                Error al cargar las ventas: ${xhr.status === 0 ? 'Servidor no disponible' : xhr.statusText}
                            </td>
                        </tr>
                    `);
                }
            }
        });
    }

    // --- FILTROS ---
    $('#filterClient, #filterDate, #filterStatus').on('input change', function () {
        filterTable();
    });

    $('#btnClearFilters').on('click', function () {
        $('#filterClient').val('');
        $('#filterDate').val('');
        $('#filterStatus').val('');
        filterTable();
    });

    function filterTable() {
        const clientFilter = $('#filterClient').val().toLowerCase();
        const dateFilter = $('#filterDate').val();
        const statusFilter = $('#filterStatus').val();

        $('#salesTable tbody tr').each(function () {
            const $row = $(this);
            const client = $row.find('td:eq(1)').text().toLowerCase();
            const date = $row.find('td:eq(2)').text();
            const statusText = $row.find('td:eq(4)').text().trim().toUpperCase();

            let match = true;

            if (clientFilter && !client.includes(clientFilter)) {
                match = false;
            }

            if (dateFilter) {
                // Manejar diferentes formatos de fecha
                try {
                    const rowDate = new Date(date.split('/').reverse().join('-')).toISOString().split('T')[0];
                    if (rowDate !== dateFilter) {
                        match = false;
                    }
                } catch (e) {
                    // Si hay error en el parsing de fecha, no hacer match
                    match = false;
                }
            }

            if (statusFilter) {
                // Normalizar ambas cadenas a mayúsculas para que coincidan
                if (statusFilter === "COMPLETED" && statusText !== "COMPLETADA") {
                    match = false;
                }
                if (statusFilter === "CANCELLED" && statusText !== "CANCELADA") {
                    match = false;
                }
            }

            $row.toggle(match);
        });
    }

    // Cargar al inicio
    loadSales();

    // Escapar HTML para evitar inyecciones
    function escapeHtml(text) {
        const div = document.createElement("div");
        div.textContent = text;
        return div.innerHTML;
    }

    // Ejecutar después de que sidebar cargue
    waitForSidebar(() => {
        updateSidebarActiveItem();
        console.log("✅ Sidebar cargado y actualizado");
    });

    adjustResponsive();
    $(window).on('resize', adjustResponsive);

    // 👇 BOTÓN MENÚ PARA MÓVIL - NUEVO
    // Toggle sidebar en móvil
    $('#menuToggle').on('click', function() {
        $('.sidebar').toggleClass('show');
    });
    
    // Cerrar sidebar al hacer clic fuera de él en móvil
    $(document).on('click', function(e) {
        if ($(window).width() <= 768) {
            if (!$('.sidebar').is(e.target) && 
                $('.sidebar').has(e.target).length === 0 && 
                !$('#menuToggle').is(e.target)) {
                $('.sidebar').removeClass('show');
            }
        }
    });
});