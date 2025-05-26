/**
 * @interface IAIStrategy
 * @description Interfaz que define el contrato para las estrategias de IA
 */
class IAIStrategy {
    /**
     * Obtiene el siguiente movimiento de la IA
     * @param {Array<number|null>} board - Estado actual del tablero
     * @returns {number} - Índice del movimiento a realizar
     */
    getMove(board) { throw new Error('Not implemented'); }
}

module.exports = IAIStrategy; 