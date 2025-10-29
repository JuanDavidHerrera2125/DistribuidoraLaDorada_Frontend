document.addEventListener('DOMContentLoaded', function () {
    console.log("✅ createUsers.js cargado");

    // 🔑 Función para obtener headers de autenticación
    function getAuthHeaders() {
        const token = localStorage.getItem('authToken');
        if (!token) {
            alert('Debes iniciar sesión para acceder a esta página');
            window.location.href = '/login.html';
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

        // Validación de campos obligatorios
        if (!formData.userName || !formData.email || !formData.password || !formData.userRole) {
            messageDiv.style.display = 'block';
            messageDiv.className = 'alert alert-danger';
            messageDiv.innerHTML = '<i class="fas fa-exclamation-triangle me-2"></i> Por favor complete todos los campos obligatorios';
            return;
        }

        messageDiv.style.display = 'block';
        messageDiv.className = 'alert alert-info';
        messageDiv.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Creando usuario...';

        try {
            const response = await fetch('http://localhost:8080/api/users', {
                method: 'POST',
                headers: authHeaders,
                body: JSON.stringify(formData)
            });

            const text = await response.text();
            let result;
            try { 
                result = JSON.parse(text); 
            } catch {
                messageDiv.className = 'alert alert-danger';
                messageDiv.innerHTML = 'Error: respuesta del servidor no es JSON';
                console.error('Respuesta del servidor:', text);
                return;
            }

            if (response.ok) {
                messageDiv.className = 'alert alert-success';
                messageDiv.innerHTML = `<i class="fas fa-check-circle me-2"></i> ${result.message || 'Usuario creado exitosamente'}`;
                form.reset();
                fetchUsers();
            } else {
                messageDiv.className = 'alert alert-danger';
                messageDiv.innerHTML = `<i class="fas fa-exclamation-triangle me-2"></i> ${result.message || result.error || 'Error al crear usuario'}`;
            }
        } catch (error) {
            console.error('Error de conexión:', error);
            messageDiv.className = 'alert alert-danger';
            messageDiv.innerHTML = `<i class="fas fa-exclamation-triangle me-2"></i> Error de conexión: ${error.message}`;
            
            // Manejo específico de errores de red
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                messageDiv.innerHTML = '<i class="fas fa-exclamation-triangle me-2"></i> Error de conexión: No se puede conectar con el servidor';
            }
        }
    });

    // Función para actualizar tabla de usuarios
    async function fetchUsers() {
        try {
            const res = await fetch('http://localhost:8080/api/users', {
                headers: authHeaders
            });

            if (!res.ok) {
                if (res.status === 401) {
                    alert('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
                    window.location.href = '/login.html';
                    return;
                }
                throw new Error(`Error HTTP: ${res.status}`);
            }

            const users = await res.json();
            const tbody = document.querySelector('#usersTable tbody');
            
            if (!tbody) {
                console.warn('No se encontró la tabla de usuarios');
                return;
            }

            tbody.innerHTML = '';
            
            if (!users || users.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No hay usuarios registrados</td></tr>';
                return;
            }

            users.forEach(u => {
                tbody.innerHTML += `
                    <tr>
                        <td>${u.id || ''}</td>
                        <td>${u.userName || ''}</td>
                        <td>${u.email || ''}</td>
                        <td>${u.userRole || ''}</td>
                        <td>
                            <button class="btn btn-sm btn-primary btnEdit">Editar</button>
                            <button class="btn btn-sm btn-danger btnDelete">Eliminar</button>
                        </td>
                    </tr>`;
            });
        } catch (err) {
            console.error('Error cargando usuarios:', err);
            
            const tbody = document.querySelector('#usersTable tbody');
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error al cargar los usuarios</td></tr>';
            }
            
            // Manejo de errores de autenticación
            if (err.message && err.message.includes('401')) {
                alert('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
                window.location.href = '/login.html';
            }
        }
    }

    // Cargar usuarios al iniciar
    fetchUsers();
});