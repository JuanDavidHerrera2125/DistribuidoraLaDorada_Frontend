// Archivo para manejar el almacenamiento de clientes en el navegador
class ClientStorage {
    constructor() {
        this.storageKey = 'clients_list';
        this.clients = this.loadClients();
    }

    // Cargar clientes desde localStorage
    loadClients() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error('Error cargando clientes:', e);
            return [];
        }
    }

    // Guardar clientes en localStorage
    saveClients() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.clients));
        } catch (e) {
            console.error('Error guardando clientes:', e);
        }
    }

    // Agregar cliente
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

    // Generar ID único para el cliente
    generateUniqueId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 5);
        return `client_${timestamp}_${random}`;
    }

    // Obtener todos los clientes
    getAllClients() {
        return [...this.clients]; // Devolver copia para evitar mutaciones externas
    }

    // Obtener cliente por ID
    getClientById(id) {
        const client = this.clients.find(client => client.id === id);
        return client ? { ...client } : null; // Devolver copia
    }

    // Actualizar cliente
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

    // Eliminar cliente
    deleteClient(id) {
        const initialLength = this.clients.length;
        this.clients = this.clients.filter(client => client.id !== id);
        if (this.clients.length !== initialLength) {
            this.saveClients();
            return true;
        }
        return false;
    }

    // Obtener últimos clientes (por defecto 10)
    getLastClients(count = 10) {
        return [...this.clients.slice(-count)]; // Devolver copia
    }

    // Buscar clientes por término
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

    // Obtener cantidad total de clientes
    getClientCount() {
        return this.clients.length;
    }

    // Limpiar todos los clientes (útil para pruebas o logout)
    clearAllClients() {
        this.clients = [];
        this.saveClients();
    }

    // Verificar si existe un cliente con el mismo teléfono
    clientExistsByPhone(phone) {
        return this.clients.some(client => client.phone === phone);
    }

    // Verificar si existe un cliente con el mismo email
    clientExistsByEmail(email) {
        if (!email) return false;
        return this.clients.some(client => client.email === email);
    }

    // Obtener clientes por tipo (CASH o CREDIT)
    getClientsByType(type) {
        return this.clients
            .filter(client => client.type === type)
            .map(client => ({ ...client })); // Devolver copias
    }

    // Obtener estadísticas básicas
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