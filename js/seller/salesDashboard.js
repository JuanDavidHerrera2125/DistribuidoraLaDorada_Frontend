$(document).ready(function () {

    let client = null; // Variable global para guardar el cliente seleccionado

    // Recuperar el cliente guardado en localStorage
    const savedClient = localStorage.getItem('selectedClient');
    if (savedClient) {
        client = JSON.parse(savedClient);

        // Rellenar el formulario con los datos del cliente
        $('#clientName').val(client.name || '');
        $('#clientAddress').val(client.address || '');
        $('#clientPhone').val(client.phone || '');
    }

    // Lógica para registrar la venta
    $('#saleForm').on('submit', function (e) {
        e.preventDefault();

        if (!client) {
            alert('Primero selecciona un cliente antes de registrar la venta.');
            return;
        }

        const saleData = {
            clientId: client.id,
            product: $('#product').val(),
            quantity: parseInt($('#quantity').val()),
            price: parseFloat($('#price').val())
        };

        $.ajax({
            url: 'http://localhost:8080/api/sales',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(saleData),
            success: function () {
                alert('Venta registrada correctamente');
                $('#saleForm')[0].reset();

                // Mantener datos del cliente tras limpiar
                $('#clientName').val(client.name || '');
                $('#clientAddress').val(client.address || '');
                $('#clientPhone').val(client.phone || '');
            },
            error: function () {
                alert('Error al registrar la venta.');
            }
        });
    });
});
