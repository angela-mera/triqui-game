/**
 * @interface IConnectionManager
 * @description Interfaz que define el contrato para la gestión de conexiones
 */
class IConnectionManager {
    /**
     * Maneja una nueva conexión
     * @param {Socket} socket - Objeto socket de la conexión
     * @returns {void}
     */
    handleConnection(socket) { throw new Error('Not implemented'); }

    /**
     * Maneja una desconexión
     * @param {Socket} socket - Objeto socket de la conexión
     * @returns {void}
     */
    handleDisconnection(socket) { throw new Error('Not implemented'); }

    /**
     * Maneja una reconexión
     * @param {Socket} socket - Objeto socket de la conexión
     * @returns {void}
     */
    handleReconnection(socket) { throw new Error('Not implemented'); }
}

module.exports = IConnectionManager; 