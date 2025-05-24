/**
 * @fileoverview Cliente principal del juego Tic-tac-toe
 * @author Tu Nombre
 */

/**
 * @class Game
 * @description Clase principal que maneja la lógica del juego
 */
class Game {
    /**
     * @constructor
     * @description Inicializa el juego y configura los elementos del DOM
     */
    constructor() {
        this.initializeProperties();
        this.initializeUI();
        this.setupEventListeners();
        this.setupSocketListeners();
        this.setupThemeModes();
        this.setupSymbolColor();
    }

    /**
     * @private
     * @description Inicializa las propiedades de la clase
     */
    initializeProperties() {
        this.socket = io();
        this.gameId = null;
        this.playerSymbol = null;
        this.isSinglePlayer = false;
        this.playerName = '';
        this.boardState = Array(9).fill('');
        this.round = 1;
        this.maxRounds = 5;
        this.scores = { X: 0, O: 0 };
        this.points = { X: 0, O: 0 };
        this.seriesWinner = null;
        this.turnTimerDuration = 30000;
        this.turnTimerInterval = null;
    }

    /**
     * @private
     * @description Inicializa los elementos de la interfaz
     */
    initializeUI() {
        this.board = document.getElementById('board');
        this.status = document.getElementById('status');
        this.restartBtn = document.getElementById('restart');
        this.scoreX = document.getElementById('score-x');
        this.scoreO = document.getElementById('score-o');
        this.roundInfo = document.getElementById('round-info');
        this.seriesWinnerInfo = document.getElementById('series-winner');
        this.errorBox = document.getElementById('error-box');
        this.modeSelection = document.getElementById('mode-selection');
        this.gameContainer = document.querySelector('.container');
        this.playerNameInput = document.getElementById('player-name');
        this.chatMessages = document.getElementById('chat-messages');
        this.chatInput = document.getElementById('chat-input');
        this.chatSendBtn = document.getElementById('chat-send');
        this.leaderboardPanel = document.getElementById('leaderboard-panel');
        this.leaderboardEntries = document.getElementById('leaderboard-entries');
        this.playAgainBtn = document.getElementById('play-again-btn');
        this.backToHomeBtn = document.getElementById('back-to-home-btn');
        this.turnTimerContainer = document.getElementById('turn-timer-container');
        this.turnTimerBar = document.getElementById('turn-timer-bar');
        this.confettiCanvas = document.getElementById('confetti-canvas');
        
        this.confetti = new Confetti(this.confettiCanvas);
    }

    /**
     * @private
     * @description Configura los listeners de eventos del DOM
     */
    setupEventListeners() {
        this.setupModeSelectionListeners();
        this.setupBoardListener();
        this.setupRestartButtonListener();
        this.setupChatListeners();
        this.setupLeaderboardActions();
    }

    /**
     * @private
     * @description Configura los listeners para la selección de modo
     */
    setupModeSelectionListeners() {
        const singlePlayerBtn = document.getElementById('single-player-btn');
        const multiPlayerBtn = document.getElementById('multi-player-btn');

        if (singlePlayerBtn) {
            singlePlayerBtn.addEventListener('click', () => {
                if (this.validatePlayerName()) {
                    this.startSinglePlayerMode();
                }
            });
        }

        if (multiPlayerBtn) {
            multiPlayerBtn.addEventListener('click', () => {
                if (this.validatePlayerName()) {
                    this.startMultiPlayerMode();
                }
            });
        }
    }

    /**
     * @private
     * @description Configura el listener para el tablero
     */
    setupBoardListener() {
        if (this.board) {
            this.board.addEventListener('click', (e) => {
                const cell = e.target.closest('.cell');
                if (!cell) return;

                const position = parseInt(cell.dataset.index);
                this.makeMove(position);
            });
        }
    }

    /**
     * @private
     * @description Configura el listener para el botón de reinicio
     */
    setupRestartButtonListener() {
        if (this.restartBtn) {
            this.restartBtn.addEventListener('click', () => {
                if (this.isSinglePlayer) {
                    this.abandonGame();
                } else {
                    if (this.seriesWinnerInfo && this.seriesWinnerInfo.style.display === 'block') {
                        this.socket.emit('resetSeries', { gameId: this.gameId });
                        this.seriesWinnerInfo.style.display = 'none';
                    } else {
                        this.socket.emit('abandonGame', { gameId: this.gameId });
                    }
                }
                this.restartBtn.style.display = 'none';
            });
        }
    }

    /**
     * @private
     * @description Configura los listeners para el chat
     */
    setupChatListeners() {
        if (this.chatSendBtn && this.chatInput) {
            this.chatSendBtn.addEventListener('click', () => this.sendMessage());
            this.chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendMessage();
                }
            });
        }
    }

    /**
     * @private
     * @description Configura los listeners para el leaderboard
     */
    setupLeaderboardActions() {
        if (this.playAgainBtn) {
            this.playAgainBtn.addEventListener('click', () => {
                this.leaderboardPanel.style.display = 'none';
                if (this.isSinglePlayer) {
                    this.resetGame();
                } else {
                    this.socket.emit('resetSeries', { gameId: this.gameId });
                }
            });
        }
        if (this.backToHomeBtn) {
            this.backToHomeBtn.addEventListener('click', () => {
                this.leaderboardPanel.style.display = 'none';
                this.abandonGame();
                this.modeSelection.style.display = 'block';
            });
        }
    }

    /**
     * @private
     * @description Configura los listeners de Socket.IO
     */
    setupSocketListeners() {
        this.socket.on('connect', () => this.handleConnect());
        this.socket.on('disconnect', () => this.handleDisconnect());
        this.socket.on('waiting', () => this.handleWaiting());
        this.socket.on('gameStart', (data) => this.handleGameStart(data));
        this.socket.on('gameState', (data) => this.handleGameState(data));
        this.socket.on('opponentDisconnected', () => this.handleOpponentDisconnected());
        this.socket.on('opponentReconnected', () => this.handleOpponentReconnected());
        this.socket.on('opponentTimeout', () => this.handleOpponentTimeout());
        this.socket.on('opponentAbandoned', () => this.handleOpponentAbandoned());
        this.socket.on('chat', (msg) => this.handleChatMessage(msg));
        this.socket.on('errorMsg', ({ payload }) => this.showError(payload.message));
        this.socket.on('turnTimeout', ({ timedOutPlayer }) => this.handleTurnTimeout(timedOutPlayer));
        this.socket.on('symbolColorChanged', ({ color, symbol }) => this.handleSymbolColorChange(color, symbol));
    }

    /**
     * @private
     * @description Configura los modos de tema
     */
    setupThemeModes() {
        const themeButtons = document.querySelectorAll('.theme-btn');
        themeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const theme = btn.dataset.theme;
                document.body.className = theme;
                themeButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
    }

    /**
     * @private
     * @description Configura el selector de color de símbolo
     */
    setupSymbolColor() {
        const colorButtons = document.querySelectorAll('.symbol-color-btn');
        if (colorButtons.length) {
            colorButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    colorButtons.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    const color = btn.getAttribute('data-color');
                    document.documentElement.style.setProperty('--symbol-color', color);
                    
                    if (this.gameId) {
                        this.socket.emit('symbolColorChange', { 
                            gameId: this.gameId, 
                            color: color,
                            symbol: this.playerSymbol
                        });
                    }
                });
            });
            colorButtons[0].classList.add('active');
            const defaultColor = colorButtons[0].getAttribute('data-color');
            document.documentElement.style.setProperty('--symbol-color', defaultColor);
        }
    }

    // ... [Resto de métodos de la clase Game] ...
}

/**
 * @class Confetti
 * @description Clase para manejar la animación de confeti
 */
class Confetti {
    /**
     * @constructor
     * @param {HTMLCanvasElement} canvas - Elemento canvas para la animación
     */
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.animationId = null;
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    /**
     * @private
     * @description Ajusta el tamaño del canvas
     */
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    /**
     * @description Inicia la animación de confeti
     */
    start() {
        this.particles = [];
        for (let i = 0; i < 100; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: -10,
                size: Math.random() * 10 + 5,
                speed: Math.random() * 3 + 2,
                color: `hsl(${Math.random() * 360}, 100%, 50%)`
            });
        }
        if (!this.animationId) {
            this.animate();
        }
    }

    /**
     * @private
     * @description Anima las partículas de confeti
     */
    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        let activeParticles = 0;
        
        this.particles.forEach(particle => {
            particle.y += particle.speed;
            
            if (particle.y < this.canvas.height) {
                activeParticles++;
                this.ctx.fillStyle = particle.color;
                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
        
        if (activeParticles > 0) {
            this.animationId = requestAnimationFrame(() => this.animate());
        } else {
            this.animationId = null;
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }
}

// Inicialización del juego
window.addEventListener('load', () => {
    const gameMain = document.querySelector('.game-main');
    const scoresElement = document.getElementById('scores');
    const boardElement = document.getElementById('board');

    if (gameMain && scoresElement && boardElement) {
        if (!document.getElementById('round-info')) {
            const roundDiv = document.createElement('div');
            roundDiv.id = 'round-info';
            roundDiv.className = 'round-info';
            gameMain.insertBefore(roundDiv, scoresElement);
        }
        if (!document.getElementById('series-winner')) {
            const winnerDiv = document.createElement('div');
            winnerDiv.id = 'series-winner';
            winnerDiv.className = 'series-winner';
            winnerDiv.style.display = 'none';
            gameMain.insertBefore(winnerDiv, boardElement);
        }
        if (!document.getElementById('error-box')) {
            const errorDiv = document.createElement('div');
            errorDiv.id = 'error-box';
            errorDiv.className = 'error-box';
            errorDiv.style.display = 'none';
            gameMain.insertBefore(errorDiv, boardElement);
        }
    }
    
    window.game = new Game();
}); 