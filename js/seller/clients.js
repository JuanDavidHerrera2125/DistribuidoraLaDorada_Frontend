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
            <button class="btn btn-success btn-sm btnEdit">Guardar</button>
            <button class="btn btn-danger btn-sm btnDelete">Delete</button>
            <button class="btn btn-primary btn-sm btnGenerateSale">Generar venta</button>
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
            url: `http://localhost:8080/api/clients/${id}`,
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(updatedClient),
            success: function () {
                alert("Cliente actualizado correctamente");

                // ✅ Restaurar celdas editables
                row.find('[data-field="name"]').text(name);
                row.find('[data-field="address"]').text(address);
                row.find('[data-field="phone"]').text(phone);
                row.find('[data-field="email"]').text(email);
                row.find('[data-field="type"]').text(type === 'CASH' ? 'Contado' : 'Crédito');

                // ✅ Reconstruir acciones con texto correcto
                const actionsTd = row.find('td').last();
                actionsTd.html(`
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
    // NUEVO: Generar venta usando los datos del cliente de la fila
function generateSaleFromClient(e) {
    e.stopPropagation();

    const row = $(this).closest('tr');
    const isEditing = row.attr('data-editing') === 'true';

    // ✅ Si está en modo edición, salir de él antes de continuar
    if (isEditing) {
        // Reiniciar el estado de edición
        const originalData = {
            name: row.find('[data-field="name"]').data('original') || row.find('[data-field="name"]').text().trim(),
            address: row.find('[data-field="address"]').data('original') || row.find('[data-field="address"]').text().trim(),
            phone: row.find('[data-field="phone"]').data('original') || row.find('[data-field="phone"]').text().trim(),
            email: row.find('[data-field="email"]').data('original') || row.find('[data-field="email"]').text().trim(),
            type: row.find('[data-field="type"]').data('original') || row.find('[data-field="type"]').text().trim()
        };

        // Volver a mostrar los valores como texto
        row.find('[data-field="name"]').html(originalData.name);
        row.find('[data-field="address"]').html(originalData.address);
        row.find('[data-field="phone"]').html(originalData.phone);
        row.find('[data-field="email"]').html(originalData.email);
        row.find('[data-field="type"]').html(originalData.type);

        // Volver el botón a "Edit"
        const editBtn = row.find('.btnEdit');
        editBtn.text('Edit').removeClass('btn-success').addClass('btn-warning');

        // Quitar modo edición
        row.attr('data-editing', 'false');
    }

    // Obtener datos del cliente
    const clientData = {
        id: row.data('id'),
        name: row.find('td').eq(1).text().trim(),
        address: row.find('td').eq(2).text().trim(),
        phone: row.find('td').eq(3).text().trim(),
        email: row.find('td').eq(4).text().trim(),
        type: row.find('td').eq(5).text().trim(),
        registerDate: row.find('td').eq(6).text().trim()
    };

    // Guardar en localStorage
    localStorage.setItem('selectedClient', JSON.stringify(clientData));

    // Redirigir
    window.location.href = "../../view/seller/salesDashboard.html";
}
});