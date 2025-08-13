$(document).ready(function () {
    initEvents();
    fetchClients();

    function initEvents() {
        $('#btnLoadClients').on('click', fetchClients);
        $('#btnAddClient').on('click', createClient);
        $('#clientsTable').on('click', '.btnEdit', editOrSaveClient);
        $('#clientsTable').on('click', '.btnDelete', deleteClient);
        // NUEVO: handler por fila para generar venta
        $('#clientsTable').on('click', '.btnGenerateSale', generateSaleFromClient);

        $('#btnSearchClient').on('click', searchClient);
        $('#btnLogout').on('click', logout);
        $('#btnExport').on('click', exportClients);
    }

   // Obtener clientes
function fetchClients() {
    $.ajax({
        url: 'http://localhost:8080/api/clients/all', // 🔹 Quitado /api
        method: 'GET',
        success: renderClients,
        error: function(xhr, status, error) {
            console.error('Error al cargar clientes:', error);
            $('#clientsTableBody').empty().append('<tr><td colspan="8" class="text-center">Error al cargar clientes</td></tr>');
        }
    });
}

// Renderizar clientes
function renderClients(clients) {
    const tbody = $('#clientsTableBody');
    tbody.empty();
    
    if (clients.length === 0) {
        tbody.append('<tr><td colspan="8" class="text-center">No hay clientes registrados</td></tr>');
        return;
    }
    
    clients.forEach(client => {
        const row = `
            <tr data-id="${client.id}">
                <td>${client.id}</td>
                <td class="editable" data-field="name">${client.name || ''}</td>
                <td class="editable" data-field="address">${client.address || ''}</td>
                <td class="editable" data-field="phone">${client.phone || ''}</td>
                <td class="editable" data-field="email">${client.email || ''}</td>
                <td class="editable" data-field="type">${client.type || ''}</td>
                <td>${client.registerDate || ''}</td> <!-- 🔹 Corregido el nombre -->
                <td>
                    <button class="btn btn-warning btn-sm btnEdit">Edit</button>
                    <button class="btn btn-danger btn-sm btnDelete">Delete</button>
                    <button class="btn btn-success btn-sm btnGenerateSale">Generar venta</button>
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
            url: 'http://localhost:8080/api/clients',
            method: 'POST',
            contentType: 'application/json',
             data : JSON.stringify(client),
            success: function (response) {
                alert('Cliente creado correctamente');
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
                alert('Error al crear cliente: ' + (xhr.responseJSON?.message || error));
            }
        });
    }

    // Editar o guardar cliente
    function editOrSaveClient() {
        const row = $(this).closest('tr');
        const isEditing = row.attr('data-editing') === 'true';

        if (!isEditing) {
            // Modo edición
            row.find('.editable').each(function () {
                const value = $(this).text().trim();
                const field = $(this).data('field');

                if (field === 'type') {
                    $(this).html(`
                        <select class="form-select form-select-sm">
                            <option value="CASH" ${value.toLowerCase() === 'contado' ? 'selected' : ''}>Contado</option>
                            <option value="CREDIT" ${value.toLowerCase() === 'crédito' || value.toLowerCase() === 'credito' ? 'selected' : ''}>Crédito</option>
                        </select>
                    `);
                } else {
                    $(this).html(`<input type="text" class="form-control form-control-sm" value="${value}">`);
                }
            });

            row.attr('data-editing', 'true');
            $(this).text('Guardar').removeClass('btn-warning').addClass('btn-success');
        } else {
            // Modo guardar
            const id = row.data('id');
            const name = row.find('[data-field="name"] input').val().trim();
            const address = row.find('[data-field="address"] input').val().trim();
            const phone = row.find('[data-field="phone"] input').val().trim();
            const email = row.find('[data-field="email"] input').val().trim();
            const type = row.find('[data-field="type"] select').val();

            // Validación
            if (!name || !phone) {
                alert('Por favor, complete los campos obligatorios (Nombre y Teléfono)');
                return;
            }

            const updatedClient = { 
                id, 
                name, 
                address, 
                phone, 
                email, 
                type 
            };

            $.ajax({
                url: `http://localhost:8080/api/clients/${id}`,
                method: 'PUT',
                contentType: 'application/json',
                 data: JSON.stringify(updatedClient),
                success: function () {
                    alert("Cliente actualizado correctamente");

                    row.find('[data-field="name"]').html(name);
                    row.find('[data-field="address"]').html(address);
                    row.find('[data-field="phone"]').html(phone);
                    row.find('[data-field="email"]').html(email);
                    row.find('[data-field="type"]').html(type === 'CASH' ? 'Contado' : 'Crédito');

                    row.attr('data-editing', 'false');
                    row.find('.btn-success').text('Edit').removeClass('btn-success').addClass('btn-warning');
                },
                error: function (err) {
                    console.error("Error al actualizar:", err);
                    alert("Hubo un error al actualizar el cliente");
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
            url: `http://localhost:8080/api/clients/${id}`,
            method: 'DELETE',
            success: function () {
                row.remove();
                alert('Cliente eliminado correctamente');
            },
            error: function (xhr) {
                console.error("Error al eliminar cliente:", xhr);
                alert('Error al eliminar el cliente');
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
            url: `http://localhost:8080/api/clients/search?query=${query}`,
            method: 'GET',
            success: renderClients,
            error: function(xhr, status, error) {
                console.error('Error al buscar clientes:', error);
                $('#clientsTableBody').empty().append('<tr><td colspan="8" class="text-center">Error al buscar clientes</td></tr>');
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
        e.stopPropagation(); // no propagar clics
        const row = $(this).closest('tr');
        const clientData = {
            id: row.find('td').eq(0).text().trim(),
            name: row.find('td').eq(1).text().trim(),
            address: row.find('td').eq(2).text().trim(),
            phone: row.find('td').eq(3).text().trim(),
            email: row.find('td').eq(4).text().trim(),
            type: row.find('td').eq(5).text().trim(),
            registrationDate: row.find('td').eq(6).text().trim()
        };

        // Guardar en localStorage para que salesDashboard lo lea
        localStorage.setItem('selectedClient', JSON.stringify(clientData));

        // Redirigir al dashboard de ventas (misma ruta que usabas)
        window.location.href = "../../view/seller/salesDashboard.html";
    }
});