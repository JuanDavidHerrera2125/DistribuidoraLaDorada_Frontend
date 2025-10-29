// js/admin/reports.js
$(document).ready(function () {
    console.log("✅ reports.js cargado");

    // 🔑 Función para obtener headers de autenticación
    function getAuthHeaders() {
        const token = localStorage.getItem('authToken');
        if (!token) {
            alert('Debes iniciar sesión para acceder a esta página');
            window.location.href = '../../login.html';
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

    const $tableBody = $('#salesTableBody'); // solo el <tbody>
    const $spinner = `
        <tr>
            <td colspan="9" class="text-center text-muted py-5">
                <div class="spinner-border text-light me-2" role="status" style="width: 20px; height: 20px;"></div>
                Cargando ventas...
            </td>
        </tr>
    `;

    $tableBody.empty().append($spinner);

    // Cargar ventas
    loadSales();

    function loadSales() {
        $.ajax({
            url: 'http://localhost:8080/api/sales',
            type: 'GET',
            headers: authHeaders,
            success: function (sales) {
                $tableBody.empty();

                if (!sales || sales.length === 0) {
                    $tableBody.append('<tr><td colspan="9" class="text-center text-muted">No hay ventas registradas.</td></tr>');
                    return;
                }

                sales.forEach(sale => {
                    // Cliente
                    const clientName = sale.clientName || 'Cliente no disponible';

                    // Producto (primer detalle si existe)
                    const detail = (sale.details && sale.details.length > 0) ? sale.details[0] : null;
                    const productName = detail ? `${detail.productName} - ${detail.productModel}` : 'Producto no disponible';
                    const quantity = detail ? detail.quantity : 0;
                    const price = detail ? detail.unitPrice : 0;
                    const total = sale.total || (quantity * price);

                    // Fecha
                    const date = sale.date ? new Date(sale.date).toLocaleDateString('es-CO') : 'Sin fecha';

                    // Estado
                    const status = sale.status || 'ACTIVE';
                    const isCancelled = status === 'CANCELLED';

                    const row = `
                        <tr ${isCancelled ? 'class="table-secondary"' : ''}>
                            <td>${sale.id}</td>
                            <td class="text-start">${escapeHtml(clientName)}</td>
                            <td class="text-start">${escapeHtml(productName)}</td>
                            <td>${quantity}</td>
                            <td>$${price.toLocaleString('es-CO')}</td>
                            <td>$${total.toLocaleString('es-CO')}</td>
                            <td>${date}</td>
                            <td>
                                <span class="badge ${isCancelled ? 'bg-danger' : 'bg-success'}">
                                    ${isCancelled ? 'Cancelada' : 'Activa'}
                                </span>
                            </td>
                            <td>
                                ${isCancelled 
                                    ? '<button class="btn btn-sm btn-secondary" disabled>Cancelada</button>'
                                    : `<button class="btn btn-sm btn-danger btn-cancel-sale" 
                                            data-id="${sale.id}" 
                                            data-product="${escapeHtml(productName)}" 
                                            data-quantity="${quantity}">
                                        Cancelar Venta
                                    </button>`
                                }
                            </td>
                        </tr>
                    `;
                    $tableBody.append(row);
                });
            },
            error: function (xhr) {
                console.error('Error al cargar ventas:', xhr);
                if (xhr.status === 401) {
                    alert('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
                    window.location.href = '../../login.html';
                } else {
                    $tableBody.empty().append(`
                        <tr>
                            <td colspan="9" class="text-center text-danger py-3">
                                Error al cargar las ventas: ${xhr.status === 0 ? 'Servidor no disponible' : xhr.statusText}
                            </td>
                        </tr>
                    `);
                }
            }
        });
    }

    // Manejar cancelación de venta
    $tableBody.on('click', '.btn-cancel-sale', function () {
        const saleId = $(this).data('id');
        const productName = $(this).data('product');
        const quantity = $(this).data('quantity');

        if (!confirm(`¿Está seguro de cancelar la venta #${saleId} por ${quantity} unidades de "${productName}"?`)) {
            return;
        }

        // 1. Actualizar estado de la venta a CANCELLED (el back ya devuelve stock)
        $.ajax({
            url: `http://localhost:8080/api/sales/cancel/${saleId}`,
            type: 'POST',
            headers: authHeaders,
            success: function () {
                alert(`✅ Venta #${saleId} cancelada y stock devuelto correctamente.`);
                loadSales(); // recargar tabla
            },
            error: function (xhr) {
                console.error('Error al cancelar venta:', xhr);
                if (xhr.status === 401) {
                    alert('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
                    window.location.href = '../../login.html';
                } else {
                    alert('❌ No se pudo cancelar la venta: ' + (xhr.responseJSON?.message || 'Error desconocido'));
                }
            }
        });
    });

    // Parsear nombre del producto → "Nombre - Modelo"
    function parseProductName(fullName) {
        const parts = fullName.split(' - ');
        if (parts.length === 2) {
            return [parts[0].trim(), parts[1].trim()];
        }
        return [fullName.trim(), ''];
    }

    // Cerrar sesión
    document.getElementById('btnLogout').addEventListener('click', () => {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = "../../login.html";
    });

    // Escapar HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
});