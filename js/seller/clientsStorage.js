/**
 * ClientStorage - Clase para manejar el almacenamiento de clientes en el navegador
 * @version 1.0.0
 * @author Distribuidora La Dorada
 */
class ClientStorage {
    /**
     * Constructor de la clase
     */
    constructor() {
        this.storageKey = 'clients_list';
        this.clients = this.loadClients();
    }

    /**
     * Cargar clientes desde localStorage
     * @returns {Array} Array de clientes
     */
    loadClients() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error('Error cargando clientes:', e);
            return [];
        }
    }

    /**
     * Guardar clientes en localStorage
     */
    saveClients() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.clients));
        } catch (e) {
            console.error('Error guardando clientes:', e);
        }
    }

    /**
     * Agregar cliente
     * @param {Object} client - Objeto cliente
     * @returns {Object} Cliente agregado
     * @throws {Error} Si falta nombre o teléfono
     */
    addClient(client) {
        // Validar que el cliente tenga los campos obligatorios
        if (!client.name || !client.phone) {
            throw new Error('El cliente debe tener nombre y teléfono');
        }
        
        // Generar ID único si no existe
        if (!client.id) {
            client.id = this.generateUniqueId();
        }
        
        // Añadir timestamp si no existe
        if (!client.timestamp) {
            client.timestamp = new Date().toISOString();
        }
        
        // Establecer valores por defecto
        client.email = client.email || '';
        client.address = client.address || '';
        client.type = client.type || 'CASH';
        client.registerDate = client.registerDate || new Date().toISOString().split('T')[0];
        
        this.clients.push(client);
        this.saveClients();
        return client;
    }

    /**
     * Generar ID único para el cliente
     * @returns {String} ID único
     */
    generateUniqueId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 5);
        return `client_${timestamp}_${random}`;
    }

    /**
     * Obtener todos los clientes
     * @returns {Array} Copia del array de clientes
     */
    getAllClients() {
        return [...this.clients]; // Devolver copia para evitar mutaciones externas
    }

    /**
     * Obtener cliente por ID
     * @param {String|Number} id - ID del cliente
     * @returns {Object|null} Cliente o null si no existe
     */
    getClientById(id) {
        const client = this.clients.find(client => client.id === id);
        return client ? { ...client } : null; // Devolver copia
    }

    /**
     * Actualizar cliente
     * @param {String|Number} id - ID del cliente
     * @param {Object} updatedClient - Datos actualizados
     * @returns {Object|null} Cliente actualizado o null si no existe
     * @throws {Error} Si falta nombre o teléfono
     */
    updateClient(id, updatedClient) {
        const index = this.clients.findIndex(client => client.id === id);
        if (index !== -1) {
            // Validar campos obligatorios en la actualización
            if (updatedClient.name === '' || updatedClient.phone === '') {
                throw new Error('El cliente debe tener nombre y teléfono');
            }
            
            this.clients[index] = { 
                ...this.clients[index], 
                ...updatedClient,
                id: this.clients[index].id, // Mantener el ID original
                timestamp: new Date().toISOString() // Actualizar timestamp
            };
            this.saveClients();
            return { ...this.clients[index] }; // Devolver copia
        }
        return null;
    }

    /**
     * Eliminar cliente
     * @param {String|Number} id - ID del cliente
     * @returns {Boolean} true si se eliminó, false si no existe
     */
    deleteClient(id) {
        const initialLength = this.clients.length;
        this.clients = this.clients.filter(client => client.id !== id);
        if (this.clients.length !== initialLength) {
            this.saveClients();
            return true;
        }
        return false;
    }

    /**
     * Obtener últimos clientes
     * @param {Number} count - Cantidad de clientes (por defecto 10)
     * @returns {Array} Array de clientes
     */
    getLastClients(count = 10) {
        return [...this.clients.slice(-count)]; // Devolver copia
    }

    /**
     * Buscar clientes por término
     * @param {String} query - Término de búsqueda
     * @returns {Array} Array de clientes que coinciden
     */
    searchClients(query) {
        if (!query || query.trim() === '') {
            return this.getAllClients();
        }
        
        const term = query.toLowerCase().trim();
        return this.clients.filter(client => 
            (client.name && client.name.toLowerCase().includes(term)) ||
            (client.phone && client.phone.includes(term)) ||
            (client.email && client.email.toLowerCase().includes(term)) ||
            (client.address && client.address.toLowerCase().includes(term))
        ).map(client => ({ ...client })); // Devolver copias
    }

    /**
     * Obtener cantidad total de clientes
     * @returns {Number} Cantidad de clientes
     */
    getClientCount() {
        return this.clients.length;
    }

    /**
     * Limpiar todos los clientes
     */
    clearAllClients() {
        this.clients = [];
        this.saveClients();
    }

    /**
     * Verificar si existe un cliente con el mismo teléfono
     * @param {String} phone - Teléfono a verificar
     * @returns {Boolean} true si existe, false si no
     */
    clientExistsByPhone(phone) {
        return this.clients.some(client => client.phone === phone);
    }

    /**
     * Verificar si existe un cliente con el mismo email
     * @param {String} email - Email a verificar
     * @returns {Boolean} true si existe, false si no
     */
    clientExistsByEmail(email) {
        if (!email) return false;
        return this.clients.some(client => client.email === email);
    }

    /**
     * Obtener clientes por tipo
     * @param {String} type - Tipo de cliente (CASH o CREDIT)
     * @returns {Array} Array de clientes
     */
    getClientsByType(type) {
        return this.clients
            .filter(client => client.type === type)
            .map(client => ({ ...client })); // Devolver copias
    }

    /**
     * Obtener estadísticas básicas
     * @returns {Object} Objeto con estadísticas
     */
    getStats() {
        const total = this.clients.length;
        const cashClients = this.clients.filter(c => c.type === 'CASH').length;
        const creditClients = this.clients.filter(c => c.type === 'CREDIT').length;
        
        return {
            total,
            cashClients,
            creditClients,
            cashPercentage: total > 0 ? Math.round((cashClients / total) * 100) : 0,
            creditPercentage: total > 0 ? Math.round((creditClients / total) * 100) : 0
        };
    }
}

// Instancia global para usar en otros archivos
const clientStorage = new ClientStorage();

// Exportar para uso en módulos (opcional)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ClientStorage;
}