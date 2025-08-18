// js/seller/sales.js
$(document).ready(function () {
  const $tableBody = $('#salesTable tbody');

  // Mostrar spinner mientras carga
  const $spinner = `
    <tr>
      <td colspan="5" class="text-center text-muted py-4">
        <div class="spinner-border text-primary me-2" role="status" style="width: 20px; height: 20px;"></div>
        Cargando ventas...
      </td>
    </tr>
  `;
  $tableBody.html($spinner);

  // Botón de recargar
  $('#btnLoadSales').on('click', function () {
    loadSales();
  });

  // Cargar ventas
  function loadSales() {
    $.get('http://localhost:8080/api/sales')
      .done(function (sales) {
        $tableBody.empty();

        if (!sales || sales.length === 0) {
          $tableBody.append('<tr><td colspan="5" class="text-center text-muted">No hay ventas registradas.</td></tr>');
          return;
        }

        sales.forEach(sale => {
          const client = sale.clientName || "N/A";
          const date = sale.date ? new Date(sale.date).toLocaleDateString('es-CO') : "N/A";
          const total = sale.total != null ? `$${sale.total.toLocaleString('es-CO')}` : "N/A";
          const status = sale.status || "N/A";

          const row = `
            <tr>
              <td>${sale.id}</td>
              <td class="text-start">${escapeHtml(client)}</td>
              <td>${date}</td>
              <td>${total}</td>
              <td>
                <span class="badge ${status === 'CANCELLED' ? 'bg-danger' : 'bg-success'}">
                  ${status === 'CANCELLED' ? 'Cancelada' : 'Completada'}
                </span>
              </td>
            </tr>
          `;
          $tableBody.append(row);
        });
      })
      .fail(function (xhr) {
        $tableBody.empty().append(`
          <tr>
            <td colspan="5" class="text-center text-danger py-3">
              Error al cargar las ventas: ${xhr.status === 0 ? 'Servidor no disponible' : xhr.statusText}
            </td>
          </tr>
        `);
      });
  }

  // Cargar al inicio
  loadSales();

  // Escapar HTML para evitar inyecciones
  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
});
