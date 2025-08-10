$(document).ready(function () {
    const $table = $('#stockTable');
    $table.empty().append('<tr><td colspan="4" class="text-center">Cargando productos...</td></tr>');

    $.get('http://localhost:8080/api/products/with-stock')
        .done(function (products) {
            console.log("✅ Productos con stock recibidos:", products);
            $table.empty();

            if (!products || products.length === 0) {
                $table.append('<tr><td colspan="4" class="text-center text-muted">No hay productos registrados.</td></tr>');
                return;
            }

            // 🔢 Paso 1: Agrupar por name + model y sumar totalStock
            const grouped = {};

            products.forEach(product => {
                const key = `${product.name}__${product.model}`; // Clave única: "Silla Mesedora__Wuayú"
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

            // 📥 Paso 2: Convertir el objeto agrupado a array
            const groupedProducts = Object.values(grouped);

            // 🧾 Paso 3: Mostrar en la tabla
            groupedProducts.forEach(p => {
                $table.append(`
                    <tr>
                        <td>${escapeHtml(p.name || 'Sin nombre')}</td>
                        <td><span class="badge bg-info">${escapeHtml(p.model || 'Sin diseño')}</span></td>
                        <td>$${(p.unitPrice || 0).toLocaleString('es-CO')}</td>
                        <td>${p.totalStock}</td>
                    </tr>
                `);
            });

            if (groupedProducts.length === 0) {
                $table.append('<tr><td colspan="4" class="text-center text-muted">No hay productos para mostrar.</td></tr>');
            }
        })
        .fail(function (xhr, status, error) {
            console.error('❌ Error al cargar productos:', status, error, xhr);
            $table.empty().append('<tr><td colspan="4" class="text-center text-danger">Error cargando productos.</td></tr>');
        });

    // Función para escapar caracteres HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
});