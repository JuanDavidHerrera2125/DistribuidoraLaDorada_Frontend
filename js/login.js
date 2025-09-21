$(document).ready(function () {

    // 🔹 Mostrar/ocultar contraseña
    $('#togglePassword').on('click', function() {
        const passwordInput = $('#password');
        const type = passwordInput.attr('type') === 'password' ? 'text' : 'password';
        passwordInput.attr('type', type);
        $(this).html(type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>');
    });

    // 🔹 Alternar formularios
    $('#showRecoverForm').click(function(e) {
        e.preventDefault();
        $('#loginForm').hide();
        $('#recoverForm').show();
        $('#errorMsg').hide();
    });

    $('#backToLogin').click(function(e) {
        e.preventDefault();
        $('#recoverForm').hide();
        $('#loginForm').show();
        $('#recoverMsg').hide();
    });

    // 🔹 LOGIN
    $('#loginForm').submit(function(e) {
        e.preventDefault();
        const email = $('#email').val().trim();
        const password = $('#password').val().trim();

        if(!email || !password) return showError('Por favor, complete todos los campos');

        hideError();

        $.ajax({
            url: 'http://localhost:8080/api/auth/login',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ email, password }),
            success: function(data) {
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));

                const role = data.user.role;
                if(role === 'ADMIN') window.location.href = '/view/admin/dashboard.html';
                else if(role === 'SELLER') window.location.href = '/view/seller/salesDashboard.html';
                else window.location.href = '/view/common/unautorized.html';
            },
            error: function(xhr) {
                showError(xhr.responseText || 'Credenciales inválidas o acceso no autorizado.');
            }
        });
    });

    // 🔹 RECUPERAR CONTRASEÑA
    $('#recoverForm').submit(function(e) {
        e.preventDefault();
        const email = $('#recoverEmail').val().trim();
        if(!email) return showRecoverMsg('Ingrese su email', 'danger');

        $.ajax({
            url: 'http://localhost:8080/api/auth/recover',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ email }),
            success: function(msg) {
                showRecoverMsg(msg, 'success');
            },
            error: function(xhr) {
                showRecoverMsg(xhr.responseText || 'Error enviando correo', 'danger');
            }
        });
    });

    // 🔹 Funciones auxiliares
    function showError(msg) {
        $('#errorMsg').text(msg).show();
    }
    function hideError() {
        $('#errorMsg').hide();
    }
    function showRecoverMsg(msg, type) {
        $('#recoverMsg').text(msg).attr('class', 'alert alert-' + type).show();
    }
});
