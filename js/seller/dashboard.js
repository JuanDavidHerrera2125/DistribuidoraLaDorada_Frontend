$(document).ready(function () {
    initEvents();
    fetchClients();

    function initEvents() {
        $('#btnLoadClients').on('click', fetchClients);
        $('#btnAddClient').on('click', createClient);
        $('#clientsTable').on('click', '.btnEdit', editOrSaveClient);
        $('#clientsTable').on('click', '.btnDelete', deleteClient);
    }

    // Cargar clientes
    function fetchClients() {
        console.log("Obteniendo clientes de la base de datos");
        $.ajax({
            url: 'http://localhost:8080/api/clients',
            method: 'GET',
            success: function (clients) {
                console.log("Clientes obtenidos: ", clients);
                const tbody = $('#clientsTable tbody');
                tbody.empty();
                clients.forEach(client => {
                    const row = `
                        <tr data-id="${client.id}">
                            <td>${client.id}</td>
                            <td class="editable" data-field="name">${client.name}</td>
                            <td class="editable" data-field="address">${client.address}</td>
                            <td class="editable" data-field="phone">${client.phone}</td>
                            <td class="editable" data-field="email">${client.email || ''}</td>
                            <td class="editable" data-field="type">${client.type || ''}</td>
                            <td>${client.registrationDate}</td>
                            <td>
                                <button class="btn btn-warning btn-sm btnEdit">Edit</button>
                                <button class="btn btn-danger btn-sm btnDelete">Delete</button>
                            </td>
                        </tr>`;
                    tbody.append(row);
                });
            }
        });
    }

    // Crear cliente
    function createClient() {
        const client = {
            name: $('#clienteName').val(),
            address: $('#clienteAddress').val(),
            phone: $('#clientePhone').val(),
            email: $('#clienteEmail').val(),
            type: $('#clienteType').val(),
            registerDate: $('#clienteRegisterDate').val()

        };

        console.log("Creando cliente: ", client);

        $.ajax({
            url: 'http://localhost:8080/api/clients',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(client),
            success: function () {
                alert('Cliente creado correctamente');
                fetchClients();

                    // 🔽 Limpiar campos del formulario después de crear cliente
    $('#clienteName').val('');
    $('#clienteAddress').val('');
    $('#clientePhone').val('');
    $('#clienteEmail').val('');
    $('#clienteType').val('');
    $('#clienteRegisterDate').val('');
            }
        });
    }

 function editOrSaveClient() {
  const row = $(this).closest('tr');
  const isEditing = row.attr('data-editing') === 'true';

  if (!isEditing) {
    // Entrar en modo edición
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
    // Guardar datos
    const id = row.data('id');
    const name = row.find('[data-field="name"] input').val().trim();
    const address = row.find('[data-field="address"] input').val().trim();
    const phone = row.find('[data-field="phone"] input').val().trim();
    const email = row.find('[data-field="email"] input').val().trim();
    const type = row.find('[data-field="type"] select').val();

    const updatedClient = { id, name, address, phone, email, type };

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



   // Función para eliminar cliente
   function deleteClient() {
        const row = $(this).closest('tr');
        const id = row.data('id');

        console.log("Botón eliminar clickeado");
        console.log("ID capturado:", id);

        if (!id) {
            alert('ID de cliente no encontrado.');
            return;
        }

        $.ajax({
            url: `http://localhost:8080/api/clients/${id}`,
            method: 'DELETE',
            success: function () {
                row.remove();
                console.log("Cliente eliminado con éxito.");
            },
            error: function (xhr) {
                console.error("Error al eliminar cliente:", xhr);
                alert('Error al eliminar el cliente');
            }
        });
    }
});
