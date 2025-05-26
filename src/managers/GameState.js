const IGameState = require('../interfaces/IGameState');
const AIFactory = require('../strategies/AIFactory');
const { checkWinner, isBoardFull, createEmptyBoard, determineSeriesWinner } = require('../utils/GameUtils');

/**
 * @class GameState
 * @extends IGameState
 * @description Implementación del estado del juego
 */
class GameState extends IGameState {
    /**
     * @param {IAIStrategy|null} aiStrategy - Estrategia de IA para el modo single player
     */
    constructor(aiStrategy = null) {
        super();
        this.board = createEmptyBoard();
        this.currentPlayer = 'X';
        this.winner = null;
        this.isDraw = false;
        this.scores = { X: 0, O: 0 };
        this.round = 1;
        this.maxRounds = 5;
        this.seriesWinner = null;
        this.aiStrategy = aiStrategy || AIFactory.createAI();
    }

    /**
     * Realiza un movimiento en el tablero
     * @param {number} position - Posición donde se realizará el movimiento
     * @returns {boolean} - True si el movimiento fue válido
     */
    makeMove(position) {
        if (this.board[position] === null && !this.winner) {
            this.board[position] = this.currentPlayer;
            this.checkWinner();
            this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
            return true;
        }
        return false;
    }

    /**
     * Verifica si hay un ganador en el tablero
     * @returns {void}
     */
    checkWinner() {
        const winner = checkWinner(this.board);
        if (winner) {
            this.winner = winner;
            this.scores[this.winner]++;
            return;
        }

        if (isBoardFull(this.board)) {
            this.isDraw = true;
        }
    }

    /**
     * Avanza al siguiente round
     * @returns {void}
     */
    nextRound() {
        if (this.round < this.maxRounds) {
            this.board = createEmptyBoard();
            this.currentPlayer = 'X';
            this.winner = null;
            this.isDraw = false;
            this.round++;
        } else {
            this.determineSeriesWinner();
        }
    }

    /**
     * Determina el ganador de la serie
     * @private
     * @returns {void}
     */
    determineSeriesWinner() {
        this.seriesWinner = determineSeriesWinner(this.scores);
    }

    /**
     * Reinicia la serie de juegos
     * @returns {void}
     */
    resetSeries() {
        this.board = createEmptyBoard();
        this.currentPlayer = 'X';
        this.winner = null;
        this.isDraw = false;
        this.scores = { X: 0, O: 0 };
        this.round = 1;
        this.seriesWinner = null;
    }

    /**
     * Realiza un movimiento de la IA
     * @returns {boolean} - True si se realizó el movimiento
     */
    makeAIMove() {
        if (this.currentPlayer === 'O' && !this.winner) {
            const move = this.aiStrategy.getMove([...this.board]);
            if (move !== -1) {
                return this.makeMove(move);
            }
        }
        return false;
    }
}

module.exports = GameState; 