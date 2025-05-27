const IConnectionManager = require('../interfaces/IConnectionManager');
const TurnTimeoutManager = require('./TurnTimeoutManager');

/**
 * @class ConnectionManager
 * @extends IConnectionManager
 * @description Gestiona las conexiones de los jugadores y los eventos del socket
 */
class ConnectionManager extends IConnectionManager {
    /**
     * @param {SocketIO.Server} io - Instancia de Socket.IO
     * @param {GameManager} gameManager - Instancia del GameManager
     * @param {TurnTimeoutManager} turnTimeoutManager - Instancia del TurnTimeoutManager
     */
    constructor(io, gameManager, turnTimeoutManager) {
        super();
        this.io = io;
        this.gameManager = gameManager;
        this.turnTimeoutManager = turnTimeoutManager;
        this.rateLimitMap = new Map();
        this.RATE_LIMIT_WINDOW = 2000;
        this.RATE_LIMIT_MAX = 5;
    }

    /**
     * Maneja una nueva conexión
     * @param {Socket} socket - Objeto socket de la conexión
     * @returns {void}
     */
    handleConnection(socket) {
        console.log('User connected:', socket.id);
        this.setupSocketListeners(socket);
    }

    /**
     * Maneja una desconexión
     * @param {Socket} socket - Objeto socket de la conexión
     * @returns {void}
     */
    handleDisconnection(socket) {
        console.log('User disconnected:', socket.id);
        this.gameManager.waitingPlayers = this.gameManager.waitingPlayers.filter(id => id !== socket.id);
        this.gameManager.playerNames.delete(socket.id);
        this.handlePlayerDisconnection(socket);
    }

    /**
     * Maneja una reconexión
     * @param {Socket} socket - Objeto socket de la conexión
     * @returns {void}
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
     * Configura los listeners del socket
     * @private
     * @param {Socket} socket - Objeto socket de la conexión
     * @returns {void}
     */
    setupSocketListeners(socket) {
        socket.on('join', ({ playerName }) => this.handleJoin(socket, playerName));
        socket.on('move', ({ gameId, position }) => this.handleMove(socket, gameId, position));
        socket.on('chat', ({ gameId, message }) => this.handleChat(socket, gameId, message));
        socket.on('abandonGame', ({ gameId }) => this.handleAbandonGame(socket, gameId));
        socket.on('disconnect', () => this.handleDisconnection(socket));
        socket.on('reconnect', () => this.handleReconnection(socket));
        socket.on('symbolColorChange', ({ gameId, color }) => this.handleSymbolColorChange(socket, gameId, color));
    }

    /**
     * Maneja el evento de unión de un jugador
     * @private
     * @param {Socket} socket - Objeto socket de la conexión
     * @param {string} playerName - Nombre del jugador
     * @param {string} gameMode - Modo de juego ('multiplayer' o 'single')
     * @returns {void}
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
     * Crea un nuevo juego multijugador
     * @private
     * @param {Socket} socket - Objeto socket de la conexión
     * @returns {void}
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
     * Maneja un movimiento
     * @private
     * @param {Socket} socket - Objeto socket de la conexión
     * @param {string} gameId - ID del juego
     * @param {number} position - Posición del movimiento
     * @returns {void}
     */
    handleMove(socket, gameId, position) {
        if (!this.validateMove(socket, gameId, position)) return;

        const game = this.gameManager.getGame(gameId);
        if (game.state.makeMove(position)) {
            this.turnTimeoutManager.clearTurnTimer(gameId);
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
     * Valida un movimiento
     * @private
     * @param {Socket} socket - Objeto socket de la conexión
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
     * Transmite el estado del juego a todos los jugadores
     * @private
     * @param {string} gameId - ID del juego
     * @param {Object} game - Objeto del juego
     * @returns {void}
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
                this.turnTimeoutManager.startTurnTimer(gameId, currentPlayerId);
            }
        } else {
            this.turnTimeoutManager.clearTurnTimer(gameId);
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
                        this.turnTimeoutManager.startTurnTimer(gameId, currentPlayerId);
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
                    this.turnTimeoutManager.clearTurnTimer(gameId);
                }
            }, 2000);
        }
    }

    /**
     * Maneja un mensaje de chat
     * @private
     * @param {Socket} socket - Objeto socket de la conexión
     * @param {string} gameId - ID del juego
     * @param {string} message - Mensaje del chat
     * @returns {void}
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
     * Maneja el abandono de un juego
     * @private
     * @param {Socket} socket - Objeto socket de la conexión
     * @param {string} gameId - ID del juego
     * @returns {void}
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
     * Maneja la desconexión de un jugador
     * @private
     * @param {Socket} socket - Objeto socket de la conexión
     * @returns {void}
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
     * Crea un juego en modo single player
     * @private
     * @param {Socket} socket - Objeto socket de la conexión
     * @param {string} playerName - Nombre del jugador
     * @returns {void}
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
     * Maneja el cambio de color de un símbolo
     * @private
     * @param {Socket} socket - Objeto socket de la conexión
     * @param {string} gameId - ID del juego
     * @param {string} color - Nuevo color del símbolo
     * @returns {void}
     */
    handleSymbolColorChange(socket, gameId, color) {
        const game = this.gameManager.getGame(gameId);
        if (game && game.players.includes(socket.id)) {
            this.io.to(gameId).emit('symbolColorChanged', { color, symbol: game.symbols[socket.id] });
        }
    }
}

module.exports = ConnectionManager; 