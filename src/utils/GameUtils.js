/**
 * @module GameUtils
 * @description Utilidades comunes para el juego
 */

/**
 * Verifica si hay un ganador en el tablero
 * @param {Array<number|null>} board - Estado del tablero
 * @returns {string|null} - Símbolo del ganador o null si no hay ganador
 */
function checkWinner(board) {
    const winPatterns = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // horizontales
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // verticales
        [0, 4, 8], [2, 4, 6]             // diagonales
    ];

    for (const pattern of winPatterns) {
        const [a, b, c] = pattern;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a];
        }
    }
    return null;
}

/**
 * Verifica si el tablero está lleno
 * @param {Array<number|null>} board - Estado del tablero
 * @returns {boolean} - True si el tablero está lleno
 */
function isBoardFull(board) {
    return !board.includes(null);
}

/**
 * Verifica si una posición es válida
 * @param {number} position - Posición a verificar
 * @returns {boolean} - True si la posición es válida
 */
function isValidPosition(position) {
    return typeof position === 'number' && position >= 0 && position <= 8;
}

/**
 * Verifica si un movimiento es válido
 * @param {Array<number|null>} board - Estado del tablero
 * @param {number} position - Posición del movimiento
 * @returns {boolean} - True si el movimiento es válido
 */
function isValidMove(board, position) {
    return isValidPosition(position) && board[position] === null;
}

/**
 * Obtiene las posiciones disponibles en el tablero
 * @param {Array<number|null>} board - Estado del tablero
 * @returns {Array<number>} - Array con las posiciones disponibles
 */
function getAvailableMoves(board) {
    return board
        .map((cell, index) => cell === null ? index : null)
        .filter(index => index !== null);
}

/**
 * Crea un nuevo tablero vacío
 * @returns {Array<null>} - Tablero vacío
 */
function createEmptyBoard() {
    return Array(9).fill(null);
}

/**
 * Determina el ganador de una serie
 * @param {Object} scores - Objeto con los puntajes
 * @returns {string} - Símbolo del ganador o 'Empate'
 */
function determineSeriesWinner(scores) {
    if (scores.X > scores.O) return 'X';
    if (scores.O > scores.X) return 'O';
    return 'Empate';
}

module.exports = {
    checkWinner,
    isBoardFull,
    isValidPosition,
    isValidMove,
    getAvailableMoves,
    createEmptyBoard,
    determineSeriesWinner
}; 