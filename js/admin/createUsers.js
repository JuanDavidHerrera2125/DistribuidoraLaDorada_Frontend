document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('userForm');
    const messageDiv = document.getElementById('message');

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const formData = {
            userName: document.getElementById('userName').value,
            email: document.getElementById('email').value,
            password: document.getElementById('password').value,
            userRole: document.getElementById('userRole').value
        };

        messageDiv.style.display = 'block';
        messageDiv.className = 'alert alert-info';
        messageDiv.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Creando usuario...';

        const token = localStorage.getItem('authToken');

        try {
            const response = await fetch('http://localhost:8080/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const text = await response.text();
            let result;
            try { result = JSON.parse(text); } 
            catch {
                messageDiv.className = 'alert alert-danger';
                messageDiv.innerHTML = 'Error: respuesta del servidor no es JSON';
                console.error('Respuesta del servidor:', text);
                return;
            }

            if (response.ok) {
                messageDiv.className = 'alert alert-success';
                messageDiv.innerHTML = `<i class="fas fa-check-circle me-2"></i> ${result.message}`;
                form.reset();
                fetchUsers();
            } else {
                messageDiv.className = 'alert alert-danger';
                messageDiv.innerHTML = `<i class="fas fa-exclamation-triangle me-2"></i> ${result.message || text}`;
            }
        } catch (error) {
            messageDiv.className = 'alert alert-danger';
            messageDiv.innerHTML = `<i class="fas fa-exclamation-triangle me-2"></i> Error de conexión: ${error.message}`;
        }
    });

    // Función para actualizar tabla de usuarios
    async function fetchUsers() {
        const token = localStorage.getItem('authToken');
        try {
            const res = await fetch('http://localhost:8080/api/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const users = await res.json();
            const tbody = document.querySelector('#usersTable tbody');
            tbody.innerHTML = '';
            users.forEach(u => {
                tbody.innerHTML += `
                    <tr>
                        <td>${u.id}</td>
                        <td>${u.userName}</td>
                        <td>${u.email}</td>
                        <td>${u.userRole}</td>
                        <td>
                            <button class="btn btn-sm btn-primary btnEdit">Editar</button>
                            <button class="btn btn-sm btn-danger btnDelete">Eliminar</button>
                        </td>
                    </tr>`;
            });
        } catch (err) {
            console.error('Error cargando usuarios:', err);
        }
    }

    fetchUsers();
});
