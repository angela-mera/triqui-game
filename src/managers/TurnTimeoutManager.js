/**
 * @class TurnTimeoutManager
 * @description Gestiona los timeouts de los turnos de los jugadores
 */
class TurnTimeoutManager {
    /**
     * @param {SocketIO.Server} io - Instancia de Socket.IO
     * @param {GameManager} gameManager - Instancia del GameManager
     */
    constructor(io, gameManager) {
        this.io = io;
        this.gameManager = gameManager;
        this.timers = new Map();
        this.TIMEOUT_MS = 30000; // 30 segundos
    }

    /**
     * Inicia el temporizador para un turno
     * @param {string} gameId - ID del juego
     * @param {string} currentPlayerId - ID del jugador actual
     * @returns {void}
     */
    startTurnTimer(gameId, currentPlayerId) {
        this.clearTurnTimer(gameId);
        const timeoutId = setTimeout(() => {
            this.handleTimeout(gameId, currentPlayerId);
        }, this.TIMEOUT_MS);
        this.timers.set(gameId, timeoutId);
    }

    /**
     * Limpia el temporizador de un juego
     * @param {string} gameId - ID del juego
     * @returns {void}
     */
    clearTurnTimer(gameId) {
        if (this.timers.has(gameId)) {
            clearTimeout(this.timers.get(gameId));
            this.timers.delete(gameId);
        }
    }

    /**
     * Maneja el timeout de un turno
     * @param {string} gameId - ID del juego
     * @param {string} playerId - ID del jugador que se quedó sin tiempo
     * @returns {void}
     */
    handleTimeout(gameId, playerId) {
        const game = this.gameManager.getGame(gameId);
        if (!game || game.state.winner || game.state.isDraw) return;

        game.state.currentPlayer = game.state.currentPlayer === 'X' ? 'O' : 'X';
        this.io.to(gameId).emit('turnTimeout', { timedOutPlayer: playerId });

        this.io.to(gameId).emit('gameState', {
            board: game.state.board,
            currentPlayer: game.state.currentPlayer,
            scores: game.state.scores,
            winner: game.state.winner,
            isDraw: game.state.isDraw,
            round: game.state.round,
            maxRounds: game.state.maxRounds,
            seriesWinner: game.state.seriesWinner
        });

        const nextPlayerId = Object.keys(game.symbols).find(id => game.symbols[id] === game.state.currentPlayer);
        if (nextPlayerId) {
            this.startTurnTimer(gameId, nextPlayerId);
        }
    }
}

module.exports = TurnTimeoutManager; 