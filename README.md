🛒 Sistema de Gestión de Ventas (Emprendimiento Familiar)
Una solución integral diseñada para digitalizar el control de inventarios, ventas y facturación, permitiendo una gestión organizada mediante roles de usuario diferenciados.

👥 Gestión de Roles y Seguridad
El sistema implementa un control de acceso basado en roles (RBAC), donde la aplicación redirige automáticamente al usuario según su perfil tras un inicio de sesión seguro.

Autenticación: Sistema de Login con contraseñas encriptadas en la base de datos.

Seguridad: Manejo de Tokens de autenticación para proteger las rutas y peticiones.

Roles:

Admin: Gestión total de usuarios (creación de otros Admins y Sellers), control de stock, supervisión y cancelación de ventas con retorno automático al inventario.

Seller: Gestión de clientes, generación de ventas y seguimiento de estados en tiempo real.

🛠️ Stack Tecnológico
Backend
Java & Spring Boot: Corazón del sistema bajo una arquitectura Monolítica.

Spring Security: Implementación de seguridad, encriptación y manejo de tokens.

Hibernate (JPA): ORM para la gestión y mapeo de la base de datos.

MySQL: Base de datos relacional local para el almacenamiento de información.

Frontend
Arquitectura MVC: Separación clara entre la lógica de negocio y la interfaz de usuario.

Bootstrap, HTML5 & CSS3: Diseño de interfaz moderno y funcional.

JavaScript & AJAX: Comunicación asíncrona con el servidor para actualizaciones en tiempo real sin recargar la página.


Shutterstock
📋 Funcionalidades Principales
📦 Control de Inventario: Actualización dinámica de stock. Si una venta se cancela, el sistema reintegra automáticamente los productos al inventario.

💰 Proceso de Venta: Registro de clientes, generación de facturas automáticas y cálculo de ventas diarias.

🕒 Tiempo Real: Los vendedores pueden monitorear el estado de sus ventas de manera inmediata gracias a la integración de AJAX.

📑 Reportes: Seguimiento de facturación y métricas de rendimiento diario.
