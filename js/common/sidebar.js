$(document).ready(function () {
    // Cargar el HTML del sidebar en el contenedor
    $("#sidebarContainer").load("../../components/sidebar.html", function () {
        // Después de que cargue el HTML, configuramos el menú según el rol
        renderMenu();
    });
});

function renderMenu() {
    // Simulación: obtener rol desde localStorage (ejemplo)
    const role = localStorage.getItem("userRole") || "SELLER"; // o "ADMIN"

    const menu = $("#sidebarMenu");

    menu.empty(); // Limpiar por si acaso

    if (role === "SELLER") {
        menu.append(`
            <li><a href="/view/seller/salesDashboard.html" class="nav-link text-white">Dashboard</a></li>
            <li><a href="/view/seller/sales.html" class="nav-link text-white">Ventas</a></li>
            <li><a href="/view/seller/clients.html" class="nav-link text-white">Clientes</a></li>
        `);
    }

    if (role === "ADMIN") {
        menu.append(`
            <li><a href="/view/admin/dashboard.html" class="nav-link text-white">Dashboard</a></li>
            <li><a href="/view/admin/products.html" class="nav-link text-white">Productos</a></li>
            <li><a href="/view/admin/reports.html" class="nav-link text-white">Reportes</a></li>
            <li><a href="/view/admin/config.html" class="nav-link text-white">Configuración</a></li>
        `);
    }
}
