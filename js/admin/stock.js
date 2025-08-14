$(document).ready(function () {
    const $tbody = $('#stockTable tbody'); // SOLO el cuerpo de la tabla
    
    $tbody.empty().append('<tr><td colspan="4" class="text-center">Cargando productos...</td></tr>');

    $.get('http://localhost:8080/api/products/with-stock')
        .done(function (products) {
            console.log("✅ Productos con stock recibidos:", products);
            $tbody.empty();

            if (!products || products.length === 0) {
                $tbody.append('<tr><td colspan="4" class="text-center text-muted">No hay productos registrados.</td></tr>');
                return;
            }

            const grouped = {};
            products.forEach(product => {
                const key = `${product.name}__${product.model}`;
                if (!grouped[key]) {
                    grouped[key] = {
                        name: product.name,
                        model: product.model,
                        unitPrice: product.unitPrice,
                        totalStock: 0
                    };
                }
                grouped[key].totalStock += product.totalStock || 0;
            });

            const groupedProducts = Object.values(grouped);

            groupedProducts.forEach(p => {
                $tbody.append(`
                    <tr>
                        <td>${escapeHtml(p.name || 'Sin nombre')}</td>
                        <td class="text-center"><span class="badge bg-info">${escapeHtml(p.model || 'Sin diseño')}</span></td>
                        <td class="text-center">$${(p.unitPrice || 0).toLocaleString('es-CO')}</td>
                        <td class="text-center">${p.totalStock}</td>
                    </tr>
                `);
            });

            if (groupedProducts.length === 0) {
                $tbody.append('<tr><td colspan="4" class="text-center text-muted">No hay productos para mostrar.</td></tr>');
            }
        })
        .fail(function (xhr, status, error) {
            console.error('❌ Error al cargar productos:', status, error, xhr);
            $tbody.empty().append('<tr><td colspan="4" class="text-center text-danger">Error cargando productos.</td></tr>');
        });

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
});
