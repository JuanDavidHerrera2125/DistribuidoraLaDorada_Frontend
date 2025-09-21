// Crear usuario
document.getElementById('userForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const formData = {
        userName: document.getElementById('userName').value,
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
        role: document.getElementById('userRole').value
    };

    const messageDiv = document.getElementById('message');
    messageDiv.style.display = 'block';
    messageDiv.className = 'alert alert-info';
    messageDiv.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Creando usuario...';

    const token = localStorage.getItem('authToken');

    try {
        const response = await fetch('/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (response.ok) {
            messageDiv.className = 'alert alert-success';
            messageDiv.innerHTML = `<i class="fas fa-check-circle me-2"></i> ${result.message}`;
            document.getElementById('userForm').reset();
            fetchUsers();
        } else {
            messageDiv.className = 'alert alert-danger';
            messageDiv.innerHTML = `<i class="fas fa-exclamation-triangle me-2"></i> ${result.message || result}`;
        }
    } catch (error) {
        messageDiv.className = 'alert alert-danger';
        messageDiv.innerHTML = `<i class="fas fa-exclamation-triangle me-2"></i> Error de conexión: ${error.message}`;
    }
});

// Cargar usuarios existentes
async function fetchUsers() {
    const token = localStorage.getItem('authToken');
    const tbody = document.querySelector('#usersTable tbody');
    tbody.innerHTML = '<tr><td colspan="5">Cargando...</td></tr>';

    try {
        const response = await fetch('/api/users', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const users = await response.json();

        tbody.innerHTML = '';
        users.forEach(user => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${user.id}</td>
                <td><input type="text" class="form-control" value="${user.userName}" id="name-${user.id}"></td>
                <td><input type="email" class="form-control" value="${user.email}" id="email-${user.id}"></td>
                <td>
                    <select class="form-select" id="role-${user.id}">
                        <option value="ADMIN" ${user.role === 'ADMIN' ? 'selected' : ''}>ADMIN</option>
                        <option value="SELLER" ${user.role === 'SELLER' ? 'selected' : ''}>SELLER</option>
                    </select>
                </td>
                <td>
                    <button class="btn btn-success btn-sm" onclick="updateUser(${user.id})">Guardar</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteUser(${user.id})">Eliminar</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="5">Error al cargar usuarios</td></tr>`;
        console.error(error);
    }
}

// Actualizar usuario
async function updateUser(id) {
    const token = localStorage.getItem('authToken');
    const userName = document.getElementById(`name-${id}`).value;
    const email = document.getElementById(`email-${id}`).value;
    const role = document.getElementById(`role-${id}`).value;

    try {
        const response = await fetch(`/api/users/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ userName, email, role })
        });

        const result = await response.json();
        if (response.ok) {
            alert(`Usuario actualizado: ${result.message}`);
            fetchUsers();
        } else {
            alert(`Error: ${result.message || result}`);
        }
    } catch (error) {
        alert(`Error de conexión: ${error.message}`);
    }
}

// Eliminar usuario
async function deleteUser(id) {
    if (!confirm('¿Está seguro de eliminar este usuario?')) return;

    const token = localStorage.getItem('authToken');

    try {
        const response = await fetch(`/api/users/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            alert('Usuario eliminado correctamente');
            fetchUsers();
        } else {
            alert('Error al eliminar usuario');
        }
    } catch (error) {
        alert(`Error de conexión: ${error.message}`);
    }
}

// Inicializar tabla al cargar
document.addEventListener('DOMContentLoaded', fetchUsers);
