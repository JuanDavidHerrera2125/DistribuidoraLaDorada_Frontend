// js/auth.js - Protección de rutas por rol

/**
 * Verifica autenticación y rol permitido
 * @param {Array} allowedRoles - Roles permitidos (ej: ['ADMIN'], ['SELLER'], ['ADMIN', 'SELLER'])
 */
function checkAuth(allowedRoles = []) {
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('authToken');

    // Si no hay usuario o token, redirigir a login
    if (!user || !token) {
        window.location.href = '/login.html';
        return false;
    }

    // Si se especificaron roles permitidos y el rol del usuario no está en la lista
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        window.location.href = '/view/common/unautorized.html';
        return false;
    }

    return true; // Usuario autenticado y autorizado
}

/**
 * Cierra la sesión: limpia localStorage y redirige a login
 */
function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = '/login.html';
}

/**
 * Obtiene los datos del usuario actual (para mostrar en navbar, perfil, etc.)
 * @returns {Object|null} Datos del usuario o null si no está logueado
 */
function getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}