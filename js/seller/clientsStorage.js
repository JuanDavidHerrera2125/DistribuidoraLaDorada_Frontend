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
        // Añadir timestamp si no existe
        if (!client.timestamp) {
            client.timestamp = new Date().toISOString();
        }
        
        this.clients.push(client);
        this.saveClients();
        return client;
    }

    // Obtener todos los clientes
    getAllClients() {
        return this.clients;
    }

    // Obtener cliente por ID
    getClientById(id) {
        return this.clients.find(client => client.id === id);
    }

    // Actualizar cliente
    updateClient(id, updatedClient) {
        const index = this.clients.findIndex(client => client.id === id);
        if (index !== -1) {
            this.clients[index] = { ...this.clients[index], ...updatedClient };
            this.saveClients();
            return this.clients[index];
        }
        return null;
    }

    // Eliminar cliente
    deleteClient(id) {
        this.clients = this.clients.filter(client => client.id !== id);
        this.saveClients();
        return true;
    }

    // Obtener últimos clientes (por defecto 10)
    getLastClients(count = 10) {
        return this.clients.slice(-count);
    }

    // Buscar clientes por término
    searchClients(query) {
        const term = query.toLowerCase();
        return this.clients.filter(client => 
            client.name.toLowerCase().includes(term) ||
            client.phone.includes(term) ||
            client.email.toLowerCase().includes(term)
        );
    }

    // Obtener cantidad total de clientes
    getClientCount() {
        return this.clients.length;
    }
}

// Instancia global para usar en otros archivos
const clientStorage = new ClientStorage();