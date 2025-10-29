// js/admin/products.js
$(document).ready(function () {
    console.log("✅ products.js cargado");

    // 🔑 Verificar autenticación INMEDIATAMENTE
    const token = localStorage.getItem('authToken');
    if (!token) {
        alert('Debes iniciar sesión para acceder a esta página');
        window.location.href = '/login.html';
        return; // ¡Detener toda ejecución!
    }

    const AUTH_HEADERS = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    // ✅ Resto del código SOLO si hay token
    const today = new Date().toISOString().split('T')[0];
    $('#registrationDate').val(today);

    const BASE_PRICES = {
        "Silla Mesedora": 100000,
        "Silla Fija": 90000,
        "Silla Barra": 110000,
        "Silla Sala": 95000,
        "Silla Huevo": 85000,
        "Silla Columpio": 105000,
        "Silla Pequeña": 75000,
        "Silla Brazona": 120000
    };

    const DESIGN_PRICES = {
        "Wuayú": 80000,
        "Canasta": 60000,
        "Sencilla": 40000,
        "Extra Grande": 100000,
        "Fútbol": 50000,
        "Imagen": 75000
    };

    $('#nameSelect').on('change', function () {
        const show = $(this).val() === 'Otro';
        $('#customNameContainer').toggle(show);
        updateUnitPrice();
    });

    $('#model').on('change', updateUnitPrice);
    $('#customName').on('input', function () {
        if ($('#nameSelect').val() === 'Otro') updateUnitPrice();
    });

    function updateUnitPrice() {
        let name = $('#nameSelect').val();
        if (name === 'Otro') name = $('#customName').val().trim();
        const model = $('#model').val();

        const base = BASE_PRICES[name] || 0;
        const design = DESIGN_PRICES[model] || 0;
        $('#unitPrice').val(base + design || '');
    }

    let isSubmitting = false;
    $('#productForm').on('submit', function (e) {
        e.preventDefault();
        if (isSubmitting) return;
        isSubmitting = true;

        // Validaciones (igual que antes)
        let name = $('#nameSelect').val();
        if (name === 'Otro') {
            name = $('#customName').val().trim();
            if (!name) { alert('Ingrese nombre personalizado'); isSubmitting = false; return; }
        } else if (!name) {
            alert('Seleccione tipo de silla'); isSubmitting = false; return;
        }

        const unitPrice = parseFloat($('#unitPrice').val());
        const model = $('#model').val();
        const initialStock = parseInt($('#initialStock').val(), 10);

        if (isNaN(unitPrice) || unitPrice <= 0) { alert('Precio inválido'); isSubmitting = false; return; }
        if (!model) { alert('Seleccione diseño'); isSubmitting = false; return; }
        if (isNaN(initialStock) || initialStock < 0) { alert('Stock inválido'); isSubmitting = false; return; }

        const productData = {
            name,
            description: $('#description').val().trim(),
            unitPrice,
            model,
            registrationDate: $('#registrationDate').val(),
            active: $('#active').val() === 'true',
            initialStock
        };

        $.ajax({
            url: 'http://localhost:8080/api/products/create-with-stock',
            type: 'POST',
            headers: AUTH_HEADERS, // ✅ Usamos el header predefinido
             data: JSON.stringify(productData),
            success: function (product) {
                alert(`✅ Producto "${product.name}" registrado`);
                window.location.href = 'stock.html';
            },
            error: function (xhr) {
                console.error('Error:', xhr);
                alert('❌ Error: ' + (xhr.responseJSON?.message || 'No autorizado. Inicia sesión nuevamente.'));

                // Si es 401, limpiar y redirigir
                if (xhr.status === 401) {
                    localStorage.removeItem('authToken');
                    window.location.href = '/login.html';
                }
            },
            complete: () => { isSubmitting = false; }
        });
    });

    // Cargar tabla de stock si existe
    if ($('#stockTable').length > 0) {
        loadStockTable();
    }

    function loadStockTable() {
        const $tbody = $('#stockTable tbody');
        $tbody.empty().append('<tr><td colspan="4" class="text-center">Cargando...</td></tr>');

        $.ajax({
            url: 'http://localhost:8080/api/products/with-stock',
            headers: AUTH_HEADERS,
            success: function (products) {
                $tbody.empty();
                if (!Array.isArray(products) || products.length === 0) {
                    $tbody.append('<tr><td colspan="4" class="text-center">Sin productos</td></tr>');
                    return;
                }

                const grouped = {};
                products.forEach(p => {
                    const key = `${p.name}__${p.model}`;
                    if (!grouped[key]) {
                        grouped[key] = { name: p.name, model: p.model, unitPrice: p.unitPrice, totalStock: 0 };
                    }
                    grouped[key].totalStock += (p.stock?.quantity || 0);
                });

                Object.values(grouped).forEach(p => {
                    $tbody.append(`
                        <tr>
                            <td>${escapeHtml(p.name)}</td>
                            <td class="text-center"><span class="badge bg-info">${escapeHtml(p.model)}</span></td>
                            <td class="text-center">$${(p.unitPrice).toLocaleString('es-CO')}</td>
                            <td class="text-center">${p.totalStock}</td>
                        </tr>
                    `);
                });
            },
            error: function (xhr) {
                $tbody.empty().append(`<tr><td colspan="4" class="text-center text-danger">Error: ${xhr.status}</td></tr>`);
                if (xhr.status === 401) {
                    localStorage.removeItem('authToken');
                    window.location.href = '/login.html';
                }
            }
        });
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
});