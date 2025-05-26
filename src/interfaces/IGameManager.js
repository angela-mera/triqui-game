/**
 * @interface IGameManager
 * @description Interfaz que define el contrato para la gestión de juegos
 */
class IGameManager {
    /**
     * Crea un nuevo juego
     * @param {string} player1 - ID del primer jugador
     * @param {string} player2 - ID del segundo jugador
     * @returns {string} - ID del juego creado
     */
    createGame(player1, player2) { throw new Error('Not implemented'); }

    /**
     * Obtiene un juego por su ID
     * @param {string} gameId - ID del juego
     * @returns {Object|null} - Objeto del juego o null si no existe
     */
    getGame(gameId) { throw new Error('Not implemented'); }

    /**
     * Elimina un juego
     * @param {string} gameId - ID del juego a eliminar
     * @returns {void}
     */
    removeGame(gameId) { throw new Error('Not implemented'); }
}

module.exports = IGameManager; 