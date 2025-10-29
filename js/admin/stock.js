$(document).ready(function () {
    console.log("✅ stock.js cargado");

    // 🔑 Verificar autenticación
    function getAuthHeaders() {
        const token = localStorage.getItem('authToken');
        if (!token) {
            alert('Debes iniciar sesión');
            window.location.href = '/login.html';
            return null;
        }
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    }

    // Cargar sidebar
    $("#sidebar").load("../../components/sidebar-admin.html");

    const $tbody = $('#stockTableBody');

    // Función para cargar y agrupar stock
    function loadStock() {
        $tbody.empty().append(`
            <tr>
                <td colspan="4" class="text-center text-muted py-5">
                    <div class="spinner-border text-light me-2" role="status" style="width: 20px; height: 20px;"></div>
                    Cargando productos...
                </td>
            </tr>
        `);

        const headers = getAuthHeaders();
        if (!headers) return;

        $.ajax({
            url: 'http://localhost:8080/api/products/with-stock',
            type: 'GET',
            headers: headers,
            success: function (products) {
                $tbody.empty();
                if (!Array.isArray(products) || products.length === 0) {
                    $tbody.append(`
                        <tr>
                            <td colspan="4" class="text-center text-muted py-3">
                                No hay productos en el inventario.
                            </td>
                        </tr>
                    `);
                    return;
                }

                // 🔹 Agrupar por combinación (nombre + modelo)
                const grouped = {};
                products.forEach(p => {
                    const key = `${p.name}__${p.model}`;
                    if (!grouped[key]) {
                        grouped[key] = {
                            name: p.name,
                            model: p.model,
                            unitPrice: p.unitPrice,
                            totalStock: 0
                        };
                    }
                    grouped[key].totalStock += p.currentStock;
                });

                // 🔹 Mostrar cada combinación única
                Object.values(grouped).forEach(item => {
                    $tbody.append(`
                        <tr>
                            <td class="text-start">${escapeHtml(item.name || '—')}</td>
                            <td class="text-center">
                                <span class="badge bg-info">${escapeHtml(item.model || '—')}</span>
                            </td>
                            <td class="text-center">$${(item.unitPrice || 0).toLocaleString('es-CO')}</td>
                            <td class="text-center">${item.totalStock}</td>
                        </tr>
                    `);
                });
            },
            error: function (xhr) {
                console.error('❌ Error al cargar stock:', xhr);
                $tbody.empty().append(`
                    <tr>
                        <td colspan="4" class="text-center text-danger py-3">
                            Error al cargar el inventario (${xhr.status})
                        </td>
                    </tr>
                `);
                if (xhr.status === 401) {
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('user');
                    window.location.href = '/login.html';
                }
            }
        });
    }

    // Función de escape HTML
    function escapeHtml(text) {
        if (typeof text !== 'string') return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Cargar al iniciar
    loadStock();

    // Botón de refrescar
    $('#btnRefreshStock').on('click', loadStock);

    // Función global de logout
    window.logout = function() {
        const token = localStorage.getItem('authToken');
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        if (token) {
            $.ajax({
                url: 'http://localhost:8080/api/api/auth/logout',
                type: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            }).always(() => {
                window.location.href = '/login.html';
            });
        } else {
            window.location.href = '/login.html';
        }
    };
});