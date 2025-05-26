/**
 * @interface IGameState
 * @description Interfaz que define el contrato para el estado del juego
 */
class IGameState {
    /**
     * Realiza un movimiento en el tablero
     * @param {number} position - Posición donde se realizará el movimiento
     * @returns {boolean} - True si el movimiento fue válido, false en caso contrario
     */
    makeMove(position) { throw new Error('Not implemented'); }

    /**
     * Verifica si hay un ganador en el tablero
     * @returns {void}
     */
    checkWinner() { throw new Error('Not implemented'); }

    /**
     * Avanza al siguiente round de la serie
     * @returns {void}
     */
    nextRound() { throw new Error('Not implemented'); }

    /**
     * Reinicia la serie de juegos
     * @returns {void}
     */
    resetSeries() { throw new Error('Not implemented'); }
}

module.exports = IGameState; 