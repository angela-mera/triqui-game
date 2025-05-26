const IAIStrategy = require('../interfaces/IAIStrategy');
const { checkWinner, isBoardFull } = require('../utils/GameUtils');

/**
 * @class MinimaxStrategy
 * @extends IAIStrategy
 * @description Implementación de la estrategia Minimax para la IA
 */
class MinimaxStrategy extends IAIStrategy {
    /**
     * Obtiene el siguiente movimiento usando el algoritmo Minimax
     * @param {Array<number|null>} board - Estado actual del tablero
     * @returns {number} - Índice del mejor movimiento
     */
    getMove(board) {
        let bestScore = -Infinity;
        let bestMove = 0;
        
        for (let i = 0; i < 9; i++) {
            if (board[i] === null) {
                board[i] = 'O';
                let score = this.minimax(board, 0, false);
                board[i] = null;
                
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = i;
                }
            }
        }
        
        return bestMove;
    }

    /**
     * Implementación del algoritmo Minimax
     * @private
     * @param {Array<number|null>} board - Estado del tablero
     * @param {number} depth - Profundidad actual en el árbol de búsqueda
     * @param {boolean} isMaximizing - Indica si es el turno del maximizador
     * @returns {number} - Puntuación del movimiento
     */
    minimax(board, depth, isMaximizing) {
        const winner = checkWinner(board);
        if (winner === 'O') return 10 - depth;
        if (winner === 'X') return depth - 10;
        if (isBoardFull(board)) return 0;

        if (isMaximizing) {
            let bestScore = -Infinity;
            for (let i = 0; i < 9; i++) {
                if (board[i] === null) {
                    board[i] = 'O';
                    let score = this.minimax(board, depth + 1, false);
                    board[i] = null;
                    bestScore = Math.max(score, bestScore);
                }
            }
            return bestScore;
        } else {
            let bestScore = Infinity;
            for (let i = 0; i < 9; i++) {
                if (board[i] === null) {
                    board[i] = 'X';
                    let score = this.minimax(board, depth + 1, true);
                    board[i] = null;
                    bestScore = Math.min(score, bestScore);
                }
            }
            return bestScore;
        }
    }
}

module.exports = MinimaxStrategy; 