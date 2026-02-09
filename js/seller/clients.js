$(document).ready(function () {
    console.log("✅ clients-seller.js cargado");

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
            if ($('#sidebarClients').length > 0) {
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
            $('#clientsTable').addClass('table-responsive');
            $('.card-body').css('padding', '10px');
            $('.main-content').css('padding', '10px');
            // 👇 FIX: Asegurar que el contenido pueda scrollear
            $('body').css('overflow-y', 'auto');
        } else {
            $('#clientsTable').removeClass('table-responsive');
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

    initEvents();
    fetchClients();

    function initEvents() {
        $('#btnLoadClients').on('click', fetchClients);
        $('#btnAddClient').on('click', createClient);
        $('#clientsTable').on('click', '.btnEdit', editOrSaveClient);
        $('#clientsTable').on('click', '.btnDelete', deleteClient);
        $('#clientsTable').on('click', '.btnGenerateSale', generateSaleFromClient);
        $('#btnSearchClient').on('click', searchClient);
        $('#btnLogout').on('click', logout);
        $('#btnExport').on('click', exportClients);
    }

    // Obtener clientes
    function fetchClients() {
        $.ajax({
            url: 'http://3.17.146.31:8080/api/clients/all',
            method: 'GET',
            headers: authHeaders,
            success: renderClients,
            error: function(xhr, status, error) {
                console.error('Error al cargar clientes:', error);
                if (xhr.status === 401) {
                    alert('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
                    window.location.href = '../../login.html';
                } else {
                    $('#clientsTableBody').empty().append('<tr><td colspan="8" class="text-center">Error al cargar clientes</td></tr>');
                }
            }
        });
    }

    // Renderizar clientes
    function renderClients(clients) {
        const tbody = $('#clientsTableBody');
        tbody.empty();
        
        if (!clients || clients.length === 0) {
            tbody.append('<tr><td colspan="8" class="text-center">No hay clientes registrados</td></tr>');
            return;
        }
        
        clients.forEach(client => {
            const row = `
                <tr data-id="${client.id}" class="fadeIn">
                    <td>${client.id}</td>
                    <td class="editable" data-field="name">${client.name || ''}</td>
                    <td class="editable" data-field="address">${client.address || ''}</td>
                    <td class="editable" data-field="phone">${client.phone || ''}</td>
                    <td class="editable" data-field="email">${client.email || ''}</td>
                    <td class="editable" data-field="type">${client.type || ''}</td>
                    <td>${client.registerDate || ''}</td>
                    <td>
                        <button class="btn btn-warning btn-sm btnEdit"><i class="fas fa-edit me-1"></i>Edit</button>
                        <button class="btn btn-danger btn-sm btnDelete"><i class="fas fa-trash me-1"></i>Delete</button>
                        <button class="btn btn-success btn-sm btnGenerateSale"><i class="fas fa-shopping-cart me-1"></i>Venta</button>
                    </td>
                </tr>`;
            tbody.append(row);
        });
    }

    // Crear cliente
    function createClient() {
        const client = {
            name: $('#clienteName').val().trim(),
            address: $('#clienteAddress').val().trim(),
            phone: $('#clientePhone').val().trim(),
            email: $('#clienteEmail').val().trim(),
            type: $('#clienteType').val(),
            registerDate: $('#clienteRegisterDate').val()
        };

        // Validación básica
        if (!client.name || !client.phone) {
            alert('Por favor, complete los campos obligatorios (Nombre y Teléfono)');
            return;
        }

        $.ajax({
            url: 'http://3.17.146.31:8080/api/clients',
            method: 'POST',
            headers: authHeaders,
            contentType: 'application/json',
            data: JSON.stringify(client),
            success: function (response) {
                alert('✅ Cliente creado correctamente');
                fetchClients();

                // Limpiar campos
                $('#clienteName').val('');
                $('#clienteAddress').val('');
                $('#clientePhone').val('');
                $('#clienteEmail').val('');
                $('#clienteType').val('');
                $('#clienteRegisterDate').val('');
            },
            error: function (xhr, status, error) {
                console.error('Error al crear cliente:', error);
                if (xhr.status === 401) {
                    alert('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
                    window.location.href = '../../login.html';
                } else {
                    alert('Error al crear cliente: ' + (xhr.responseJSON?.message || error));
                }
            }
        });
    }

    // Editar o guardar cliente
    function editOrSaveClient() {
        const row = $(this).closest('tr');
        const isEditing = row.attr('data-editing') === 'true';

        if (!isEditing) {
            // Modo edición: guardar valores originales y reemplazar celdas
            row.find('.editable').each(function () {
                const value = $(this).text().trim();
                const field = $(this).data('field');

                if (field === 'type') {
                    $(this).html(`
                        <select class="form-select form-select-sm">
                            <option value="CASH" ${value === 'Contado' ? 'selected' : ''}>Contado</option>
                            <option value="CREDIT" ${value === 'Crédito' ? 'selected' : ''}>Crédito</option>
                        </select>
                    `);
                } else {
                    $(this).html(`<input type="text" class="form-control form-control-sm" value="${value}">`);
                }
            });

            // ✅ Reconstruir completamente el <td> de acciones
            const actionsTd = row.find('td').last();
            actionsTd.html(`
                <button class="btn btn-success btn-sm btnEdit"><i class="fas fa-save me-1"></i>Guardar</button>
                <button class="btn btn-danger btn-sm btnDelete"><i class="fas fa-trash me-1"></i>Delete</button>
                <button class="btn btn-primary btn-sm btnGenerateSale"><i class="fas fa-shopping-cart me-1"></i>Generar venta</button>
            `);

            row.attr('data-editing', 'true');

        } else {
            // Modo guardar
            const id = row.data('id');
            const name = row.find('[data-field="name"] input').val().trim();
            const address = row.find('[data-field="address"] input').val().trim();
            const phone = row.find('[data-field="phone"] input').val().trim();
            const email = row.find('[data-field="email"] input').val().trim();
            const type = row.find('[data-field="type"] select').val();

            if (!name || !phone) {
                alert('Por favor, complete los campos obligatorios (Nombre y Teléfono)');
                return;
            }

            const updatedClient = { id, name, address, phone, email, type };

            $.ajax({
                url: `http://3.17.146.31:8080/api/clients/${id}`,
                method: 'PUT',
                headers: authHeaders,
                contentType: 'application/json',
                data: JSON.stringify(updatedClient),
                success: function () {
                    alert("✅ Cliente actualizado correctamente");

                    // ✅ Restaurar celdas editables
                    row.find('[data-field="name"]').text(name);
                    row.find('[data-field="address"]').text(address);
                    row.find('[data-field="phone"]').text(phone);
                    row.find('[data-field="email"]').text(email);
                    row.find('[data-field="type"]').text(type === 'CASH' ? 'Contado' : 'Crédito');

                    // ✅ Reconstruir acciones con texto correcto
                    const actionsTd = row.find('td').last();
                    actionsTd.html(`
                        <button class="btn btn-warning btn-sm btnEdit"><i class="fas fa-edit me-1"></i>Edit</button>
                        <button class="btn btn-danger btn-sm btnDelete"><i class="fas fa-trash me-1"></i>Delete</button>
                        <button class="btn btn-success btn-sm btnGenerateSale"><i class="fas fa-shopping-cart me-1"></i>Venta</button>
                    `);

                    row.attr('data-editing', 'false');
                },
                error: function (err) {
                    console.error("Error al actualizar:", err);
                    if (err.status === 401) {
                        alert('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
                        window.location.href = '../../login.html';
                    } else {
                        alert("❌ Hubo un error al actualizar el cliente");
                    }
                }
            });
        }
    }

    // Eliminar cliente
    function deleteClient() {
        const row = $(this).closest('tr');
        const id = row.data('id');

        if (!id) {
            alert('ID de cliente no encontrado.');
            return;
        }

        if (!confirm('¿Está seguro de eliminar este cliente?')) {
            return;
        }

        $.ajax({
            url: `http://3.17.146.31:8080/api/clients/${id}`,
            method: 'DELETE',
            headers: authHeaders,
            success: function () {
                row.remove();
                alert('✅ Cliente eliminado correctamente');
            },
            error: function (xhr) {
                console.error("Error al eliminar cliente:", xhr);
                if (xhr.status === 401) {
                    alert('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
                    window.location.href = '../../login.html';
                } else {
                    alert('❌ Error al eliminar el cliente');
                }
            }
        });
    }

    // Buscar cliente por nombre o documento
    function searchClient() {
        const query = $('#searchClient').val().trim();
        if (query === "") {
            fetchClients();
            return;
        }
        $.ajax({
            url: `http://3.17.146.31:8080/api/clients/search?query=${query}`,
            method: 'GET',
            headers: authHeaders,
            success: renderClients,
            error: function(xhr, status, error) {
                console.error('Error al buscar clientes:', error);
                if (xhr.status === 401) {
                    alert('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
                    window.location.href = '../../login.html';
                } else {
                    $('#clientsTableBody').empty().append('<tr><td colspan="8" class="text-center">Error al buscar clientes</td></tr>');
                }
            }
        });
    }

    // Exportar clientes
    function exportClients() {
        alert('Funcionalidad de exportación no implementada');
    }

    // Cerrar sesión
    function logout() {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = "../../login.html";
    }

    // NUEVO: Generar venta usando los datos del cliente de la fila
    function generateSaleFromClient(e) {
        e.stopPropagation();
        e.preventDefault(); // Prevenir comportamiento predeterminado

        const row = $(this).closest('tr');
        
        // Si está en modo edición, salir primero
        if (row.attr('data-editing') === 'true') {
            // Simular clic en Guardar para salir del modo edición
            row.find('.btnEdit').click();
        }

        // Obtener datos del cliente (ahora las celdas son texto)
        const clientData = {
            id: row.data('id'),
            name: row.find('[data-field="name"]').text().trim(),
            address: row.find('[data-field="address"]').text().trim(),
            phone: row.find('[data-field="phone"]').text().trim(),
            email: row.find('[data-field="email"]').text().trim(),
            type: row.find('[data-field="type"]').text().trim(),
            registerDate: row.find('td').eq(6).text().trim()
        };

        // ✅ Validar datos antes de guardar
        if (!clientData.id || !clientData.name || !clientData.phone) {
            alert('❌ Datos del cliente incompletos');
            return;
        }

        // Guardar en localStorage
        localStorage.setItem('selectedClient', JSON.stringify(clientData));
        console.log("✅ Cliente guardado para venta:", clientData);

        // ✅ Redirección correcta (mismo directorio)
        window.location.href = 'salesDashboard.html';
    }

    // 👇 BOTÓN MENÚ PARA MÓVIL - CORREGIDO
    // Toggle sidebar en móvil
    $('#menuToggle').on('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        $('.sidebar').toggleClass('show');
        // 👇 FIX: Prevenir scroll cuando sidebar está abierto
        if ($('.sidebar').hasClass('show')) {
            $('body').css('overflow', 'hidden');
        } else {
            $('body').css('overflow', 'auto');
        }
    });
    
    // Cerrar sidebar al hacer clic fuera de él en móvil
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
    
    // 👇 FIX: Prevenir que el sidebar bloquee el scroll
    $('.sidebar').on('touchmove', function(e) {
        e.stopPropagation();
    });
    
    // 👇 FIX: Asegurar que la tabla sea siempre scrollable horizontalmente
    function adjustTableResponsive() {
        if ($(window).width() < 768) {
            $('#clientsTableContainer').css({
                'overflow-x': 'auto',
                'overflow-y': 'auto'
            });
            $('#clientsTable').css('min-width', '100%');
        } else {
            $('#clientsTableContainer').css({
                'overflow-x': 'hidden',
                'overflow-y': 'auto'
            });
            $('#clientsTable').css('min-width', 'auto');
        }
    }

    // Ejecutar al cargar y al redimensionar
    adjustTableResponsive();
    $(window).on('resize', adjustTableResponsive);
    
    // 👇 FIX: Asegurar que la tabla se ajuste al contenido
    $('#clientsTableContainer').on('scroll', function() {
        if ($(window).width() < 768) {
            // Mantener el footer visible
            $('footer').css('position', 'static');
        }
    });
    
    // 👇 FIX: Forzar scroll horizontal al cargar
    setTimeout(function() {
        if ($(window).width() < 768) {
            $('#clientsTableContainer').scrollLeft(0);
        }
    }, 100);
});