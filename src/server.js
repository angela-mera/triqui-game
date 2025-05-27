const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const GameManager = require('./managers/GameManager');
const ConnectionManager = require('./managers/ConnectionManager');
const TurnTimeoutManager = require('./managers/TurnTimeoutManager');

/**
 * @class GameServer
 * @description Clase principal del servidor del juego
 */
class GameServer {
    /**
     * Constructor del servidor
     * @param {number} port - Puerto en el que se ejecutará el servidor
     */
    constructor(port = 3000) {
        this.port = port;
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = socketIO(this.server);
        
        this.setupStaticFiles();
        this.initializeManagers();
        this.setupSocketHandling();
    }

    /**
     * Configura los archivos estáticos
     * @private
     * @returns {void}
     */
    setupStaticFiles() {
        this.app.use(express.static(path.join(__dirname, '../public')));
    }

    /**
     * Inicializa los managers del juego
     * @private
     * @returns {void}
     */
    initializeManagers() {
        this.gameManager = GameManager.getInstance();
        this.turnTimeoutManager = new TurnTimeoutManager(this.io, this.gameManager);
        this.connectionManager = new ConnectionManager(this.io, this.gameManager, this.turnTimeoutManager);
    }

    /**
     * Configura el manejo de sockets
     * @private
     * @returns {void}
     */
    setupSocketHandling() {
        this.io.on('connection', (socket) => {
            this.connectionManager.handleConnection(socket);
        });
    }

    /**
     * Inicia el servidor
     * @returns {void}
     */
    start() {
        this.server.listen(this.port, () => {
            console.log(`Server running on port ${this.port}`);
        });
    }
}

// Crear e iniciar el servidor
const server = new GameServer(process.env.PORT || 3000);
server.start(); 