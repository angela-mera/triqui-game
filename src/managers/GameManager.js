const IGameManager = require('../interfaces/IGameManager');
const GameState = require('./GameState');

/**
 * @class GameManager
 * @extends IGameManager
 * @description Implementación del gestor de juegos usando el patrón Singleton
 * @implements {Singleton Pattern}
 */
class GameManager extends IGameManager {
    static instance = null;

    /**
     * Obtiene la instancia única del GameManager
     * @returns {GameManager} - Instancia única del GameManager
     */
    static getInstance() {
        if (!GameManager.instance) {
            GameManager.instance = new GameManager();
        }
        return GameManager.instance;
    }

    /**
     * Constructor privado para el patrón Singleton
     */
    constructor() {
        super();
        if (GameManager.instance) {
            return GameManager.instance;
        }
        this.games = new Map();
        this.waitingPlayers = [];
        this.playerNames = new Map();
        GameManager.instance = this;
    }

    /**
     * Crea un nuevo juego
     * @param {string} player1 - ID del primer jugador
     * @param {string} player2 - ID del segundo jugador
     * @returns {string} - ID del juego creado
     */
    createGame(player1, player2) {
        const gameId = Date.now().toString();
        const game = {
            state: new GameState(),
            players: [player1, player2],
            symbols: { [player1]: 'X', [player2]: 'O' },
            names: {
                [player1]: this.playerNames.get(player1),
                [player2]: this.playerNames.get(player2)
            }
        };
        this.games.set(gameId, game);
        return gameId;
    }

    /**
     * Obtiene un juego por su ID
     * @param {string} gameId - ID del juego
     * @returns {Object|null} - Objeto del juego o null si no existe
     */
    getGame(gameId) {
        return this.games.get(gameId);
    }

    /**
     * Elimina un juego
     * @param {string} gameId - ID del juego a eliminar
     * @returns {void}
     */
    removeGame(gameId) {
        this.games.delete(gameId);
    }

    /**
     * Crea un juego en modo single player
     * @param {string} playerId - ID del jugador
     * @param {string} playerName - Nombre del jugador
     * @param {string} aiStrategy - Estrategia de IA a usar
     * @returns {string} - ID del juego creado
     */
    createSinglePlayerGame(playerId, playerName, aiStrategy = 'minimax') {
        const gameId = Date.now().toString();
        const game = {
            state: new GameState(AIFactory.createAI(aiStrategy)),
            players: [playerId],
            symbols: { [playerId]: 'X' },
            names: {
                [playerId]: playerName,
                'AI': 'IA'
            },
            isSinglePlayer: true
        };
        this.games.set(gameId, game);
        return gameId;
    }
}

module.exports = GameManager; 