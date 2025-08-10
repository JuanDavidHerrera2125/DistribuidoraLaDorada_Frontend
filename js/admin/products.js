$(document).ready(function () {
  console.log("✅ products.js cargado");

  // Inicializa la fecha de registro con la fecha actual
  const today = new Date().toISOString().split('T')[0];
  $('#registrationDate').val(today);

  // Mostrar/ocultar campo de nombre personalizado según selección
  $('#nameSelect').on('change', function () {
    const show = $(this).val() === 'Otro';
    $('#customNameContainer').toggle(show);
    updateUnitPrice(); // Recalcular precio cuando cambia el nombre
  });

  // Actualizar precio cuando cambia el modelo (tipo de diseño)
  $('#model').on('change', function () {
    updateUnitPrice();
  });

  // Precios base para los nombres de producto (deben coincidir con backend)
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

  // Precios base para los modelos (tipos de diseño)
  const DESIGN_PRICES = {
    "Wuayú": 80000,
    "Canasta": 60000,
    "Sencilla": 40000,
    "Extra Grande": 100000,
    "Fútbol": 50000,
    "Imagen": 75000
  };

  /**
   * Calcula y actualiza el campo "Precio Unitario" sumando
   * precio base (nombre) + precio de diseño (modelo).
   */
  function updateUnitPrice() {
    let name = $('#nameSelect').val();
    if (name === 'Otro') {
      name = $('#customName').val().trim();
    }
    const model = $('#model').val();

    const basePrice = BASE_PRICES[name] || 0;
    const designPrice = DESIGN_PRICES[model] || 0;
    const totalPrice = basePrice + designPrice;

    $('#unitPrice').val(totalPrice);
  }

  // Recalcular precio si el usuario escribe un nombre personalizado
  $('#customName').on('input', function () {
    if ($('#nameSelect').val() === 'Otro') {
      updateUnitPrice();
    }
  });

  /**
   * Maneja el envío del formulario para crear un nuevo producto.
   * Valida campos y hace peticiones AJAX para crear producto y stock.
   */
  $('#productForm').on('submit', function (e) {
    e.preventDefault();

    // Validar nombre del producto
    let name = $('#nameSelect').val();
    if (name === 'Otro') {
      name = $('#customName').val().trim();
      if (!name) {
        alert('Por favor, ingrese un nombre personalizado.');
        $('#customName').focus();
        return;
      }
    } else if (!name) {
      alert('Seleccione un nombre de producto.');
      $('#nameSelect').focus();
      return;
    }

    // Validar precio unitario
    const unitPrice = parseFloat($('#unitPrice').val());
    if (isNaN(unitPrice) || unitPrice <= 0) {
      alert('El precio debe ser un número mayor a 0.');
      $('#unitPrice').focus();
      return;
    }

    // Validar modelo (tipo de diseño)
    const model = $('#model').val();
    if (!model) {
      alert('Seleccione un tipo de diseño.');
      $('#model').focus();
      return;
    }

    // Validar stock inicial
    const initialStock = parseInt($('#initialStock').val(), 10);
    if (isNaN(initialStock) || initialStock < 0) {
      alert('El stock debe ser un número mayor o igual a 0.');
      $('#initialStock').focus();
      return;
    }

    // Estado activo/inactivo
    const active = $('#active').val() === 'true';

    // Construcción del objeto producto para enviar al backend
    const productData = {
      name: name,
      description: $('#description').val().trim(),
      unitPrice: unitPrice,
      model: model,
      registrationDate: $('#registrationDate').val(),
      active: active
    };

    // Petición AJAX para crear producto
    $.ajax({
      url: 'http://localhost:8080/api/products',
      type: 'POST',
      contentType: 'application/json',
      data: JSON.stringify(productData),
      success: function (product) {
        // Si producto creado, crear o actualizar stock
        $.ajax({
          url: 'http://localhost:8080/api/stocks',
          type: 'POST',
          contentType: 'application/json',
          data: JSON.stringify({
            productId: product.id,
            currentStock: initialStock
          }),
          success: function (stock) {
            alert(`✅ Producto "${product.name}" creado con stock: ${initialStock}`);
            window.location.href = 'stock.html'; // Redirigir a lista de stock
          },
          error: function (xhr) {
            console.error('Error al crear stock:', xhr);
            if (xhr.status === 409 || xhr.status === 400) {
              // Si stock ya existe, actualizar con PUT
              $.ajax({
                url: `http://localhost:8080/api/stocks/product/${product.id}`,
                type: 'PUT',
                contentType: 'application/json',
                data: JSON.stringify({ currentStock: initialStock }),
                success: function () {
                  alert(`✅ Producto creado y stock actualizado`);
                  window.location.href = 'stock.html';
                },
                error: function () {
                  alert('⚠️ Producto creado, pero no se pudo asignar el stock.');
                  window.location.href = 'stock.html';
                }
              });
            } else {
              alert('⚠️ Producto creado, pero error en stock. Revise el panel.');
              window.location.href = 'stock.html';
            }
          }
        });
      },
      error: function (xhr) {
        console.error('Error al crear producto:', xhr);
        const errorMsg = xhr.responseJSON?.message || 'No se pudo crear el producto.';
        alert('❌ Error: ' + errorMsg);
      }
    });
  });

  /**
   * Carga los productos con stock para mostrarlos en la tabla
   * Actualiza dinámicamente el contenido de #stockTable.
   */
 function loadStockTable() {
    const $table = $('#stockTable');
    $table.empty().append('<tr><td colspan="4" class="text-center">Cargando productos...</td></tr>');

    $.get('http://localhost:8080/api/products/with-stock')
        .done(function (products) {
            $table.empty();

            if (!products || products.length === 0) {
                $table.append('<tr><td colspan="4" class="text-center text-muted">No hay productos registrados.</td></tr>');
                return;
            }

            console.log('✅ Productos con stock recibidos:', products); // ← Ya lo tienes

            products.forEach(product => {
                // 🔍 Depuración: veamos qué tiene el objeto
                console.log('📦 Producto individual:', product);

                $table.append(`
                    <tr>
                        <td>${product.name || 'Sin nombre'}</td>
                        <td><span class="badge bg-info">${product.model || 'Sin diseño'}</span></td>
                        <td>$${(product.unitPrice ?? 0).toLocaleString('es-CO')}</td>
                        <td>${product.currentStock ?? 0}</td>
                    </tr>
                `);
            });
        })
        .fail(function (xhr) {
            console.error('❌ Error al cargar productos:', xhr);
            $table.empty().append('<tr><td colspan="4" class="text-center text-danger">Error cargando productos.</td></tr>');
        });
}

});
