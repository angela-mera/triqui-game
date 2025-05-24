/**
 * @fileoverview Servidor principal del juego Tic-tac-toe
 * @author Tu Nombre
 */

const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

/**
 * @interface IGameState
 * @description Interfaz que define el contrato para el estado del juego
 */
class IGameState {
    makeMove(position) { throw new Error('Not implemented'); }
    checkWinner() { throw new Error('Not implemented'); }
    nextRound() { throw new Error('Not implemented'); }
    resetSeries() { throw new Error('Not implemented'); }
}

/**
 * @interface IGameManager
 * @description Interfaz que define el contrato para la gestión de juegos
 */
class IGameManager {
    createGame(player1, player2) { throw new Error('Not implemented'); }
    getGame(gameId) { throw new Error('Not implemented'); }
    removeGame(gameId) { throw new Error('Not implemented'); }
}

/**
 * @interface IConnectionManager
 * @description Interfaz que define el contrato para la gestión de conexiones
 */
class IConnectionManager {
    handleConnection(socket) { throw new Error('Not implemented'); }
    handleDisconnection(socket) { throw new Error('Not implemented'); }
    handleReconnection(socket) { throw new Error('Not implemented'); }
}

/**
 * @interface IAIStrategy
 * @description Interfaz que define el contrato para las estrategias de IA
 */
class IAIStrategy {
    getMove(board) { throw new Error('Not implemented'); }
}

/**
 * @class MinimaxStrategy
 * @implements {IAIStrategy}
 * @description Implementación de la estrategia Minimax para la IA
 */
class MinimaxStrategy extends IAIStrategy {
    /**
     * @param {Array} board - Tablero actual del juego
     * @returns {number} - Posición del mejor movimiento
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
     * @private
     * @param {Array} board - Tablero actual
     * @param {number} depth - Profundidad actual en el árbol de decisiones
     * @param {boolean} isMaximizing - Indica si es el turno del maximizador
     * @returns {number} - Puntuación del movimiento
     */
    minimax(board, depth, isMaximizing) {
        const winner = this.checkWinner(board);
        if (winner === 'O') return 10 - depth;
        if (winner === 'X') return depth - 10;
        if (this.isBoardFull(board)) return 0;

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

    /**
     * @private
     * @param {Array} board - Tablero a verificar
     * @returns {string|null} - Símbolo del ganador o null
     */
    checkWinner(board) {
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
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
     * @private
     * @param {Array} board - Tablero a verificar
     * @returns {boolean} - True si el tablero está lleno
     */
    isBoardFull(board) {
        return !board.includes(null);
    }
}

/**
 * @class RandomStrategy
 * @implements {IAIStrategy}
 * @description Implementación de la estrategia aleatoria para la IA
 */
class RandomStrategy extends IAIStrategy {
    /**
     * @param {Array} board - Tablero actual del juego
     * @returns {number} - Posición del movimiento aleatorio
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

/**
 * @class AIFactory
 * @description Factory para crear instancias de estrategias de IA
 */
class AIFactory {
    /**
     * @static
     * @param {string} strategyType - Tipo de estrategia a crear
     * @returns {IAIStrategy} - Instancia de la estrategia
     */
    static createAI(strategyType = 'minimax') {
        switch (strategyType.toLowerCase()) {
            case 'random':
                return new RandomStrategy();
            case 'minimax':
            default:
                return new MinimaxStrategy();
        }
    }
}

/**
 * @class GameState
 * @implements {IGameState}
 * @description Implementación del estado del juego
 */
class GameState extends IGameState {
    /**
     * @param {IAIStrategy} aiStrategy - Estrategia de IA a utilizar
     */
    constructor(aiStrategy = null) {
        super();
        this.board = Array(9).fill(null);
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
     * @param {number} position - Posición donde hacer el movimiento
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
     * @private
     * Verifica si hay un ganador en el tablero actual
     */
    checkWinner() {
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];

        for (const pattern of winPatterns) {
            const [a, b, c] = pattern;
            if (this.board[a] && this.board[a] === this.board[b] && this.board[a] === this.board[c]) {
                this.winner = this.board[a];
                this.scores[this.winner]++;
                return;
            }
        }

        if (!this.board.includes(null)) {
            this.isDraw = true;
        }
    }

    /**
     * Avanza a la siguiente ronda
     */
    nextRound() {
        if (this.round < this.maxRounds) {
            this.board = Array(9).fill(null);
            this.currentPlayer = 'X';
            this.winner = null;
            this.isDraw = false;
            this.round++;
        } else {
            this.determineSeriesWinner();
        }
    }

    /**
     * @private
     * Determina el ganador de la serie
     */
    determineSeriesWinner() {
        if (this.scores.X > this.scores.O) {
            this.seriesWinner = 'X';
        } else if (this.scores.O > this.scores.X) {
            this.seriesWinner = 'O';
        } else {
            this.seriesWinner = 'Empate';
        }
    }

    /**
     * Reinicia la serie
     */
    resetSeries() {
        this.board = Array(9).fill(null);
        this.currentPlayer = 'X';
        this.winner = null;
        this.isDraw = false;
        this.scores = { X: 0, O: 0 };
        this.round = 1;
        this.seriesWinner = null;
    }

    /**
     * @returns {boolean} - True si la IA hizo un movimiento
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

/**
 * @class GameManager
 * @implements {IGameManager}
 * @description Implementación del patrón Singleton para la gestión de juegos
 */
class GameManager extends IGameManager {
    static instance = null;

    /**
     * @static
     * @returns {GameManager} - Instancia única del GameManager
     */
    static getInstance() {
        if (!GameManager.instance) {
            GameManager.instance = new GameManager();
        }
        return GameManager.instance;
    }

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
     * @param {string} gameId - ID del juego
     * @returns {Object|null} - Estado del juego o null si no existe
     */
    getGame(gameId) {
        return this.games.get(gameId);
    }

    /**
     * @param {string} gameId - ID del juego a eliminar
     */
    removeGame(gameId) {
        this.games.delete(gameId);
    }

    /**
     * @param {string} playerId - ID del jugador
     * @param {string} playerName - Nombre del jugador
     * @param {string} aiStrategy - Estrategia de IA a utilizar
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

/**
 * @class TurnTimeoutManager
 * @description Gestiona los timeouts de los turnos
 */
class TurnTimeoutManager {
    /**
     * @param {Object} io - Instancia de Socket.IO
     * @param {GameManager} gameManager - Instancia del GameManager
     */
    constructor(io, gameManager) {
        this.io = io;
        this.gameManager = gameManager;
        this.timers = new Map();
        this.TIMEOUT_MS = 30000;
    }

    /**
     * @param {string} gameId - ID del juego
     * @param {string} currentPlayerId - ID del jugador actual
     */
    startTurnTimer(gameId, currentPlayerId) {
        this.clearTurnTimer(gameId);
        const timeoutId = setTimeout(() => {
            this.handleTimeout(gameId, currentPlayerId);
        }, this.TIMEOUT_MS);
        this.timers.set(gameId, timeoutId);
    }

    /**
     * @param {string} gameId - ID del juego
     */
    clearTurnTimer(gameId) {
        if (this.timers.has(gameId)) {
            clearTimeout(this.timers.get(gameId));
            this.timers.delete(gameId);
        }
    }

    /**
     * @private
     * @param {string} gameId - ID del juego
     * @param {string} playerId - ID del jugador que se quedó sin tiempo
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

/**
 * @class ConnectionManager
 * @implements {IConnectionManager}
 * @description Gestiona las conexiones de los jugadores
 */
class ConnectionManager extends IConnectionManager {
    /**
     * @param {Object} io - Instancia de Socket.IO
     * @param {GameManager} gameManager - Instancia del GameManager
     */
    constructor(io, gameManager) {
        super();
        this.io = io;
        this.gameManager = gameManager;
        this.rateLimitMap = new Map();
        this.RATE_LIMIT_WINDOW = 2000;
        this.RATE_LIMIT_MAX = 5;
    }

    /**
     * @param {Object} socket - Socket del jugador
     */
    handleConnection(socket) {
        console.log('User connected:', socket.id);
        this.setupSocketListeners(socket);
    }

    /**
     * @param {Object} socket - Socket del jugador
     */
    handleDisconnection(socket) {
        console.log('User disconnected:', socket.id);
        this.gameManager.waitingPlayers = this.gameManager.waitingPlayers.filter(id => id !== socket.id);
        this.gameManager.playerNames.delete(socket.id);
        this.handlePlayerDisconnection(socket);
    }

    /**
     * @param {Object} socket - Socket del jugador
     */
    handleReconnection(socket) {
        const playerInfo = this.disconnectedPlayers?.get(socket.id);
        if (playerInfo) {
            clearTimeout(playerInfo.timeout);
            this.disconnectedPlayers.delete(socket.id);
            const game = this.gameManager.getGame(playerInfo.gameId);
            if (game) {
                socket.join(playerInfo.gameId);
                socket.emit('gameStart', { gameId: playerInfo.gameId, symbol: playerInfo.symbol });
                this.io.to(playerInfo.gameId).emit('opponentReconnected');
            }
        }
    }

    /**
     * @private
     * @param {Object} socket - Socket del jugador
     */
    setupSocketListeners(socket) {
        socket.on('join', ({ playerName }) => this.handleJoin(socket, playerName));
        socket.on('move', ({ gameId, position }) => this.handleMove(socket, gameId, position));
        socket.on('chat', ({ gameId, message }) => this.handleChat(socket, gameId, message));
        socket.on('abandonGame', ({ gameId }) => this.handleAbandonGame(socket, gameId));
        socket.on('disconnect', () => this.handleDisconnection(socket));
        socket.on('reconnect', () => this.handleReconnection(socket));
        socket.on('symbolColorChange', ({ gameId, color, symbol }) => this.handleSymbolColorChange(socket, gameId, color, symbol));
    }

    /**
     * @private
     * @param {Object} socket - Socket del jugador
     * @param {string} playerName - Nombre del jugador
     * @param {string} gameMode - Modo de juego
     */
    handleJoin(socket, playerName, gameMode = 'multiplayer') {
        console.log('Player joined:', { socketId: socket.id, playerName, gameMode });
        this.gameManager.playerNames.set(socket.id, playerName);
        
        if (gameMode === 'single') {
            this.createSinglePlayerGame(socket, playerName);
        } else if (this.gameManager.waitingPlayers.length === 0) {
            this.gameManager.waitingPlayers.push(socket.id);
            socket.emit('waiting');
        } else {
            this.createNewGame(socket);
        }
    }

    /**
     * @private
     * @param {Object} socket - Socket del jugador
     */
    createNewGame(socket) {
        const player1 = this.gameManager.waitingPlayers.shift();
        const player2 = socket.id;
        const gameId = this.gameManager.createGame(player1, player2);
        
        socket.join(gameId);
        this.io.sockets.sockets.get(player1)?.join(gameId);
        
        const game = this.gameManager.getGame(gameId);
        
        this.io.to(player1).emit('gameStart', { 
            gameId, 
            symbol: 'X',
            opponentName: game.names[player2]
        });
        this.io.to(player2).emit('gameStart', { 
            gameId, 
            symbol: 'O',
            opponentName: game.names[player1]
        });
        
        this.io.to(gameId).emit('gameState', {
            board: game.state.board,
            currentPlayer: game.state.currentPlayer,
            scores: game.state.scores
        });

        this.io.to(gameId).emit('chat', {
            type: 'system',
            message: `¡Bienvenidos ${game.names[player1]} y ${game.names[player2]}! Pueden usar el chat para comunicarse.`
        });
    }

    /**
     * @private
     * @param {Object} socket - Socket del jugador
     * @param {string} gameId - ID del juego
     * @param {number} position - Posición del movimiento
     */
    handleMove(socket, gameId, position) {
        if (!this.validateMove(socket, gameId, position)) return;

        const game = this.gameManager.getGame(gameId);
        if (game.state.makeMove(position)) {
            turnTimeoutManager.clearTurnTimer(gameId);
            this.broadcastGameState(gameId, game);
            
            if (game.isSinglePlayer && !game.state.winner && !game.state.isDraw) {
                setTimeout(() => {
                    if (game.state.makeAIMove()) {
                        this.broadcastGameState(gameId, game);
                    }
                }, 500);
            }
        } else {
            socket.emit('errorMsg', { type: 'error', payload: { message: 'Movimiento no válido.' } });
        }
    }

    /**
     * @private
     * @param {Object} socket - Socket del jugador
     * @param {string} gameId - ID del juego
     * @param {number} position - Posición del movimiento
     * @returns {boolean} - True si el movimiento es válido
     */
    validateMove(socket, gameId, position) {
        const now = Date.now();
        if (!this.rateLimitMap.has(socket.id)) this.rateLimitMap.set(socket.id, []);
        const timestamps = this.rateLimitMap.get(socket.id).filter(ts => now - ts < this.RATE_LIMIT_WINDOW);
        if (timestamps.length >= this.RATE_LIMIT_MAX) {
            socket.emit('errorMsg', { type: 'error', payload: { message: 'Demasiados movimientos, espera un momento.' } });
            return false;
        }
        timestamps.push(now);
        this.rateLimitMap.set(socket.id, timestamps);

        if (typeof position !== 'number' || position < 0 || position > 8) {
            socket.emit('errorMsg', { type: 'error', payload: { message: 'Posición inválida.' } });
            return false;
        }

        const game = this.gameManager.getGame(gameId);
        if (!game) {
            socket.emit('errorMsg', { type: 'error', payload: { message: 'Partida no encontrada.' } });
            return false;
        }

        const playerSymbol = game.symbols[socket.id];
        if (playerSymbol !== game.state.currentPlayer) {
            socket.emit('errorMsg', { type: 'error', payload: { message: 'No es tu turno.' } });
            return false;
        }

        return true;
    }

    /**
     * @private
     * @param {string} gameId - ID del juego
     * @param {Object} game - Estado del juego
     */
    broadcastGameState(gameId, game) {
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

        if (!game.state.winner && !game.state.isDraw) {
            const currentPlayerId = Object.keys(game.symbols).find(id => game.symbols[id] === game.state.currentPlayer);
            if (currentPlayerId) {
                turnTimeoutManager.startTurnTimer(gameId, currentPlayerId);
            }
        } else {
            turnTimeoutManager.clearTurnTimer(gameId);
        }

        if (game.state.winner || game.state.isDraw) {
            setTimeout(() => {
                if (game.state.round < game.state.maxRounds) {
                    game.state.nextRound();
                    this.io.to(gameId).emit('gameState', {
                        board: game.state.board,
                        currentPlayer: game.state.currentPlayer,
                        scores: game.state.scores,
                        round: game.state.round,
                        maxRounds: game.state.maxRounds
                    });
                    const currentPlayerId = Object.keys(game.symbols).find(id => game.symbols[id] === game.state.currentPlayer);
                    if (currentPlayerId) {
                        turnTimeoutManager.startTurnTimer(gameId, currentPlayerId);
                    }
                } else {
                    game.state.determineSeriesWinner();
                    this.io.to(gameId).emit('gameState', {
                        board: game.state.board,
                        currentPlayer: game.state.currentPlayer,
                        scores: game.state.scores,
                        round: game.state.round,
                        maxRounds: game.state.maxRounds,
                        seriesWinner: game.state.seriesWinner
                    });
                    turnTimeoutManager.clearTurnTimer(gameId);
                }
            }, 2000);
        }
    }

    /**
     * @private
     * @param {Object} socket - Socket del jugador
     * @param {string} gameId - ID del juego
     * @param {string} message - Mensaje del chat
     */
    handleChat(socket, gameId, message) {
        const game = this.gameManager.getGame(gameId);
        if (game && game.players.includes(socket.id)) {
            const playerSymbol = game.symbols[socket.id];
            const chatMsg = {
                type: 'player',
                player: playerSymbol,
                playerName: game.names[socket.id],
                message: message
            };
            this.io.to(gameId).emit('chat', chatMsg);
        }
    }

    /**
     * @private
     * @param {Object} socket - Socket del jugador
     * @param {string} gameId - ID del juego
     */
    handleAbandonGame(socket, gameId) {
        const game = this.gameManager.getGame(gameId);
        if (game) {
            const otherPlayer = game.players.find(p => p !== socket.id);
            if (otherPlayer) {
                this.io.to(otherPlayer).emit('opponentAbandoned');
            }
            this.gameManager.removeGame(gameId);
        }
    }

    /**
     * @private
     * @param {Object} socket - Socket del jugador
     */
    handlePlayerDisconnection(socket) {
        for (const [gameId, game] of this.gameManager.games) {
            if (game.players.includes(socket.id)) {
                const otherPlayer = game.players.find(id => id !== socket.id);
                if (otherPlayer) {
                    this.io.to(gameId).emit('chat', {
                        type: 'system',
                        message: `${game.names[socket.id]} se ha desconectado.`
                    });
                    this.io.to(otherPlayer).emit('opponentDisconnected');
                }
            }
        }
    }

    /**
     * @private
     * @param {Object} socket - Socket del jugador
     * @param {string} playerName - Nombre del jugador
     */
    createSinglePlayerGame(socket, playerName) {
        const gameId = this.gameManager.createSinglePlayerGame(socket.id, playerName);
        socket.join(gameId);
        
        const game = this.gameManager.getGame(gameId);
        
        socket.emit('gameStart', { 
            gameId, 
            symbol: 'X',
            opponentName: 'IA',
            isSinglePlayer: true
        });
        
        this.io.to(gameId).emit('gameState', {
            board: game.state.board,
            currentPlayer: game.state.currentPlayer,
            scores: game.state.scores
        });

        this.io.to(gameId).emit('chat', {
            type: 'system',
            message: `¡Bienvenido ${playerName}! Estás jugando contra la IA.`
        });
    }

    /**
     * @private
     * @param {Object} socket - Socket del jugador
     * @param {string} gameId - ID del juego
     * @param {string} color - Color del símbolo
     * @param {string} symbol - Símbolo del jugador
     */
    handleSymbolColorChange(socket, gameId, color, symbol) {
        const game = this.gameManager.getGame(gameId);
        if (game && game.players.includes(socket.id)) {
            this.io.to(gameId).emit('symbolColorChanged', { color, symbol });
        }
    }
}

// Configuración del servidor
app.use(express.static(path.join(__dirname, 'public')));

// Inicialización de managers
const gameManager = GameManager.getInstance();
const connectionManager = new ConnectionManager(io, gameManager);
const turnTimeoutManager = new TurnTimeoutManager(io, gameManager);

// Manejo de conexiones Socket.IO
io.on('connection', (socket) => {
    connectionManager.handleConnection(socket);
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 