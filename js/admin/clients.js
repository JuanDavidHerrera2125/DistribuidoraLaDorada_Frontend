// js/admin/clients.js
$(document).ready(function () {
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
            url: 'http://localhost:8080/api/clients/all',
            method: 'GET',
            success: renderClients,
            error: function (xhr, status, error) {
                console.error('Error al cargar clientes:', error);
                $('#clientsTableBody').empty().append('<tr><td colspan="8" class="text-center">Error al cargar clientes</td></tr>');
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
                <tr data-id="${client.id}">
                    <td>${client.id}</td>
                    <td class="editable" data-field="name">${client.name || ''}</td>
                    <td class="editable" data-field="address">${client.address || ''}</td>
                    <td class="editable" data-field="phone">${client.phone || ''}</td>
                    <td class="editable" data-field="email">${client.email || ''}</td>
                    <td class="editable" data-field="type">${client.type || ''}</td>
                    <td>${client.registerDate || ''}</td>
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

        if (!client.name || !client.phone) {
            alert('Por favor, complete los campos obligatorios (Nombre y Teléfono)');
            return;
        }

        $.ajax({
            url: 'http://localhost:8080/api/clients',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(client),
            success: function () {
                alert('Cliente creado correctamente');
                fetchClients();

                $('#clienteName, #clienteAddress, #clientePhone, #clienteEmail, #clienteType, #clienteRegisterDate').val('');
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

            row.find('td').last().html(`
                <button class="btn btn-success btn-sm btnEdit">Guardar</button>
                <button class="btn btn-danger btn-sm btnDelete">Delete</button>
                <button class="btn btn-primary btn-sm btnGenerateSale">Generar venta</button>
            `);

            row.attr('data-editing', 'true');
        } else {
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
                url: `http://localhost:8080/api/clients/${id}`,
                method: 'PUT',
                contentType: 'application/json',
                data: JSON.stringify(updatedClient),
                success: function () {
                    alert("Cliente actualizado correctamente");

                    row.find('[data-field="name"]').text(name);
                    row.find('[data-field="address"]').text(address);
                    row.find('[data-field="phone"]').text(phone);
                    row.find('[data-field="email"]').text(email);
                    row.find('[data-field="type"]').text(type === 'CASH' ? 'Contado' : 'Crédito');

                    row.find('td').last().html(`
                        <button class="btn btn-warning btn-sm btnEdit">Edit</button>
                        <button class="btn btn-danger btn-sm btnDelete">Delete</button>
                        <button class="btn btn-success btn-sm btnGenerateSale">Generar venta</button>
                    `);

                    row.attr('data-editing', 'false');
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

    // Buscar cliente
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
            error: function (xhr, status, error) {
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

    // Generar venta desde cliente
    function generateSaleFromClient(e) {
        e.stopPropagation();

        const row = $(this).closest('tr');

        if (row.attr('data-editing') === 'true') {
            row.attr('data-editing', 'false');
        }

        const clientData = {
            id: row.data('id'),
            name: row.find('td').eq(1).text().trim(),
            address: row.find('td').eq(2).text().trim(),
            phone: row.find('td').eq(3).text().trim(),
            email: row.find('td').eq(4).text().trim(),
            type: row.find('td').eq(5).text().trim(),
            registerDate: row.find('td').eq(6).text().trim()
        };

        localStorage.setItem('selectedClient', JSON.stringify(clientData));

        // 👉 Redirigir a la vista de ventas del admin
        window.location.href = "../../view/admin/sales.html";
    }
});
