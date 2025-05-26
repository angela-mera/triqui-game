const IAIStrategy = require('../interfaces/IAIStrategy');

/**
 * @class RandomStrategy
 * @extends IAIStrategy
 * @description Implementación de una estrategia aleatoria para la IA
 */
class RandomStrategy extends IAIStrategy {
    /**
     * Obtiene un movimiento aleatorio válido
     * @param {Array<number|null>} board - Estado actual del tablero
     * @returns {number} - Índice del movimiento aleatorio
     */
    getMove(board) {
        const availableMoves = board
            .map((cell, index) => cell === null ? index : null)
            .filter(index => index !== null);
        
        if (availableMoves.length === 0) return -1;
        
        const randomIndex = Math.floor(Math.random() * availableMoves.length);
        return availableMoves[randomIndex];
    }
}

module.exports = RandomStrategy; 