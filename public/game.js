class Game {
    constructor() {
        this.socket = io();
        this.gameId = null;
        this.playerSymbol = null;
        this.isSinglePlayer = false;
        this.playerName = '';
        this.board = document.getElementById('board');
        this.status = document.getElementById('status');
        this.scoreX = document.getElementById('score-x');
        this.scoreO = document.getElementById('score-o');
        this.roundInfo = document.getElementById('round-info');
        this.seriesWinnerInfo = document.getElementById('series-winner');
        this.errorBox = document.getElementById('error-box');
        this.modeSelection = document.getElementById('mode-selection');
        this.gameContainer = document.querySelector('.container');
        this.playerNameInput = document.getElementById('player-name');
        this.symbolColorInput = document.getElementById('symbol-color');
        
        // Chat elements
        this.chatMessages = document.getElementById('chat-messages');
        this.chatInput = document.getElementById('chat-input');
        this.chatSendBtn = document.getElementById('chat-send');

        this.leaderboardPanel = document.getElementById('leaderboard-panel');
        this.leaderboardEntries = document.getElementById('leaderboard-entries');
        this.playAgainBtn = document.getElementById('play-again-btn');
        this.backToHomeBtn = document.getElementById('back-to-home-btn');
        this.confettiCanvas = document.getElementById('confetti-canvas');
        
        // Initialize confetti
        this.confetti = new Confetti(this.confettiCanvas);
        
        // Initialize board state
        this.boardState = Array(9).fill('');
        
        // Inicializar variables de juego
        this.round = 1;
        this.maxRounds = 5;
        this.scores = { X: 0, O: 0 };
        this.points = { X: 0, O: 0 };
        this.seriesWinner = null;
        this.currentPlayer = 'X';
        this.winner = null;
        this.isDraw = false;

        // Inicializar colores por defecto
        document.documentElement.style.setProperty('--symbol-color', '#9B7EDB');
        document.documentElement.style.setProperty('--opponent-symbol-color', '#4A90E2');
        
        console.log('Game initialized');
        this.setupEventListeners();
        this.setupSocketListeners();
        this.setupThemeModes();
        this.setupSymbolColor();
        this.setupLeaderboardActions();

        this.turnTimerContainer = document.getElementById('turn-timer-container');
        this.turnTimerBar = document.getElementById('turn-timer-bar');
        this.turnTimer = null;
        this.turnTimerDuration = 30000; // 30 segundos
        this.turnTimerInterval = null;
    }

    setupThemeModes() {
        const themeButtons = document.querySelectorAll('.theme-btn');
        themeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const theme = btn.dataset.theme;
                document.body.className = theme;
                // Remove active class from all buttons
                themeButtons.forEach(b => b.classList.remove('active'));
                // Add active class to clicked button
                btn.classList.add('active');
            });
        });
    }

    setupSymbolColor() {
        const colorButtons = document.querySelectorAll('.symbol-color-btn');
        if (colorButtons.length) {
            colorButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    colorButtons.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    const color = btn.getAttribute('data-color');
                    
                    // Actualizar el color del símbolo del jugador local
                    document.documentElement.style.setProperty('--symbol-color', color);
                    
                    // Emitir el cambio de color al servidor
                    if (this.gameId) {
                        this.socket.emit('symbolColorChange', { 
                            gameId: this.gameId, 
                            color: color,
                            symbol: this.playerSymbol
                        });
                    }
                });
            });
            // Seleccionar el primer color por defecto
            colorButtons[0].classList.add('active');
            const defaultColor = colorButtons[0].getAttribute('data-color');
            document.documentElement.style.setProperty('--symbol-color', defaultColor);
        }
    }

    setupEventListeners() {
        // Mode selection buttons
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

        if (this.board) {
            this.board.addEventListener('click', (e) => {
                const cell = e.target.closest('.cell');
                if (!cell) return;

                console.log('Cell clicked:', cell.dataset.index);
                const position = parseInt(cell.dataset.index);
                this.makeMove(position);
            });
        }

        // Chat event listeners
        if (this.chatSendBtn && this.chatInput) {
            this.chatSendBtn.addEventListener('click', () => this.sendMessage());
            this.chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendMessage();
                }
            });
        }
    }

    validatePlayerName() {
        const name = this.playerNameInput.value.trim();
        if (!name) {
            alert('Por favor ingresa tu nombre');
            return false;
        }
        this.playerName = name;
        return true;
    }

    startSinglePlayerMode() {
        this.isSinglePlayer = true;
        this.modeSelection.style.display = 'none';
        this.gameContainer.style.display = 'block';
        this.chatMessages.parentElement.style.display = 'none';
        this.playerSymbol = 'X';
        this.status.textContent = "Es tu turno";
        this.board.style.pointerEvents = 'auto';
        this.resetGame();
        this.updatePlayerNames();
        this.updateRound(1);
    }

    startMultiPlayerMode() {
        this.isSinglePlayer = false;
        this.modeSelection.style.display = 'none';
        this.gameContainer.style.display = 'block';
        this.chatMessages.parentElement.style.display = 'block';
        this.socket.emit('join', { playerName: this.playerName });
        this.updateRound(1);
    }

    resetGame() {
        this.boardState = Array(9).fill('');
        this.updateBoardDisplay();
        this.currentPlayer = 'X';
        this.winner = null;
        this.isDraw = false;
        this.scores = { X: 0, O: 0 };
        this.points = { X: 0, O: 0 };
        this.round = 1;
        this.seriesWinner = null;
        this.updateScores(this.scores);
        this.updateRound(this.round);
    }

    sendMessage() {
        const message = this.chatInput.value.trim();
        if (message && this.gameId) {
            console.log('Sending message:', message);
            this.socket.emit('chat', { gameId: this.gameId, message });
            this.chatInput.value = '';
        }
    }

    setupSocketListeners() {
        this.socket.on('connect', () => {
            console.log('Connected to server');
            if (this.gameId) {
                this.socket.emit('reconnect');
            }
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
        });

        this.socket.on('waiting', () => {
            console.log('Waiting for opponent');
            this.status.textContent = 'Esperando al oponente...';
            this.board.style.pointerEvents = 'none';
            this.clearError();
        });

        this.socket.on('gameStart', ({ gameId, symbol, opponentName }) => {
            console.log('Game started:', { gameId, symbol });
            this.gameId = gameId;
            this.playerSymbol = symbol;
            this.status.textContent = `${this.playerName}, eres jugador ${symbol}. ${symbol === 'X' ? '¡Tu turno!' : 'Esperando al oponente...'}`;
            this.board.style.pointerEvents = symbol === 'X' ? 'auto' : 'none';
            this.clearError();
            this.updatePlayerNames(opponentName);
            this.updateRound(1);
        });

        this.socket.on('gameState', ({ board, currentPlayer, scores, winner, isDraw, round, seriesWinner }) => {
            console.log('Game state updated:', { board, currentPlayer, scores, winner, isDraw, round, seriesWinner });
            this.updateBoard(board);
            this.updateScores(scores);
            this.updateRound(round);
            this.updateSeriesWinner(seriesWinner);
            this.clearError();

            if (seriesWinner) {
                this.status.textContent = `¡Jugador ${seriesWinner} gana la serie!`;
                this.board.style.pointerEvents = 'none';
                if (this.seriesWinnerInfo) {
                    this.seriesWinnerInfo.textContent = `¡Jugador ${seriesWinner} es el ganador absoluto!`;
                    this.seriesWinnerInfo.style.display = 'block';
                }
            } else if (winner) {
                this.status.textContent = winner === this.playerSymbol ? 
                    "¡Has ganado!" : 
                    "¡El oponente ha ganado!";
                this.board.style.pointerEvents = 'none';
            } else if (isDraw) {
                this.status.textContent = "¡Empate!";
                this.board.style.pointerEvents = 'none';
            } else {
                this.status.textContent = currentPlayer === this.playerSymbol ? 
                    "Es tu turno" : 
                    "Turno del oponente";
                this.board.style.pointerEvents = currentPlayer === this.playerSymbol ? 'auto' : 'none';
            }

            // Barra de tiempo solo si es tu turno y no hay ganador/empate
            if (!winner && !isDraw && currentPlayer === this.playerSymbol) {
                this.startTurnTimer();
            } else {
                this.stopTurnTimer();
            }
        });

        this.socket.on('opponentDisconnected', () => {
            console.log('Opponent disconnected');
            this.status.textContent = 'El oponente se ha desconectado';
            this.board.style.pointerEvents = 'none';
        });

        this.socket.on('opponentReconnected', () => {
            console.log('Opponent reconnected');
            this.status.textContent = 'El oponente se ha reconectado';
            this.board.style.pointerEvents = this.playerSymbol === this.currentPlayer ? 'auto' : 'none';
        });

        this.socket.on('opponentAbandoned', () => {
            console.log('Opponent abandoned the game');
            this.status.textContent = 'El oponente ha abandonado la partida';
            this.board.style.pointerEvents = 'none';
            this.showLeaderboard('X');
        });

        this.socket.on('chat', (msg) => {
            console.log('Chat message received:', msg);
            if (!this.chatMessages) return;

            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${msg.type}`;

            if (msg.type === 'system') {
                messageDiv.innerHTML = `<div class="text">${msg.message}</div>`;
            } else {
                const playerName = msg.player === this.playerSymbol ? this.playerName : msg.playerName;
                const isLocalPlayer = msg.player === this.playerSymbol;
                messageDiv.setAttribute('data-player', isLocalPlayer ? 'local' : 'opponent');
                messageDiv.innerHTML = `
                    <div class="player">${playerName}</div>
                    <div class="text">${msg.message}</div>
                `;
            }

            this.chatMessages.appendChild(messageDiv);
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        });

        this.socket.on('errorMsg', ({ payload }) => {
            this.showError(payload.message);
        });

        this.socket.on('turnTimeout', ({ timedOutPlayer }) => {
            if (timedOutPlayer === this.socket.id) {
                this.status.textContent = '¡Se acabó tu tiempo! Turno perdido.';
                this.board.style.pointerEvents = 'none';
            }
            this.stopTurnTimer();
        });

        // Modificar el listener de cambio de color
        this.socket.on('symbolColorChanged', ({ color, symbol }) => {
            // Solo actualizar el color si es el símbolo del otro jugador
            if (symbol !== this.playerSymbol) {
                document.documentElement.style.setProperty('--opponent-symbol-color', color);
            }
        });
    }

    makeMove(position) {
        if (this.isSinglePlayer) {
            if (this.boardState[position] === '' && !this.winner) {
                // Movimiento del jugador
                this.boardState[position] = this.playerSymbol;
                this.updateBoardDisplay();
                
                if (this.checkWinner()) {
                    if (this.winner) this.scores[this.winner]++;
                    this.handleGameEnd();
                    return;
                }

                if (this.checkDraw()) {
                    this.handleGameEnd();
                    return;
                }

                // Movimiento de la IA
                this.status.textContent = "Turno de la IA...";
                this.board.style.pointerEvents = 'none';
                
                setTimeout(() => {
                    const aiMove = this.getBestMove();
                    this.boardState[aiMove] = 'O';
                    this.updateBoardDisplay();
                    
                    if (this.checkWinner()) {
                        if (this.winner) this.scores[this.winner]++;
                        this.handleGameEnd();
                        return;
                    }

                    if (this.checkDraw()) {
                        this.handleGameEnd();
                        return;
                    }

                    this.status.textContent = "Es tu turno";
                    this.board.style.pointerEvents = 'auto';
                }, 500);
            }
        } else {
            // Multiplayer move
            if (this.gameId && this.playerSymbol) {
                this.socket.emit('move', { gameId: this.gameId, position });
            }
        }
    }

    getBestMove() {
        let bestScore = -Infinity;
        let bestMove = 0;
        const board = this.boardState;
        
        for (let i = 0; i < 9; i++) {
            if (board[i] === '') {
                board[i] = 'O';
                let score = this.minimax(board, 0, false);
                board[i] = '';
                
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = i;
                }
            }
        }
        
        return bestMove;
    }

    minimax(board, depth, isMaximizing) {
        // Check for terminal states
        const winner = this.checkWinnerForBoard(board);
        if (winner === 'O') return 10 - depth;
        if (winner === 'X') return depth - 10;
        if (this.isBoardFull(board)) return 0;

        if (isMaximizing) {
            let bestScore = -Infinity;
            for (let i = 0; i < 9; i++) {
                if (board[i] === '') {
                    board[i] = 'O';
                    let score = this.minimax(board, depth + 1, false);
                    board[i] = '';
                    bestScore = Math.max(score, bestScore);
                }
            }
            return bestScore;
        } else {
            let bestScore = Infinity;
            for (let i = 0; i < 9; i++) {
                if (board[i] === '') {
                    board[i] = 'X';
                    let score = this.minimax(board, depth + 1, true);
                    board[i] = '';
                    bestScore = Math.min(score, bestScore);
                }
            }
            return bestScore;
        }
    }

    checkWinnerForBoard(board) {
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
            [0, 4, 8], [2, 4, 6] // Diagonals
        ];

        for (const pattern of winPatterns) {
            const [a, b, c] = pattern;
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                return board[a];
            }
        }
        return null;
    }

    isBoardFull(board) {
        return !board.includes('');
    }

    checkWinner() {
        const winner = this.checkWinnerForBoard(this.boardState);
        if (winner) {
            this.winner = winner;
            return true;
        }
        return false;
    }

    checkDraw() {
        if (!this.boardState.includes('')) {
            this.isDraw = true;
            return true;
        }
        return false;
    }

    handleGameEnd() {
        if (this.winner) {
            // Sumar puntos solo si hay ganador
            this.points[this.winner] += 1000;
            this.status.textContent = this.winner === this.playerSymbol ? 
                "¡Has ganado esta partida!" : 
                "¡La IA ha ganado esta partida!";
        } else if (this.isDraw) {
            this.status.textContent = "¡Empate en esta partida!";
        }
        this.updateScores(this.scores);
        this.board.style.pointerEvents = 'none';
        setTimeout(() => {
            if (this.round < this.maxRounds) {
                this.startNextRound();
            } else {
                this.endSeries();
            }
        }, 2000);
    }

    startNextRound() {
        this.round++;
        this.boardState = Array(9).fill('');
        this.winner = null;
        this.isDraw = false;
        this.updateBoardDisplay();
        this.updateRound(this.round);
        this.status.textContent = `Partida ${this.round} de ${this.maxRounds} - Es tu turno`;
        this.board.style.pointerEvents = 'auto';
    }

    endSeries() {
        // Determinar el ganador de la serie
        let winner;
        if (this.scores.X > this.scores.O) {
            winner = 'X';
        } else if (this.scores.O > this.scores.X) {
            winner = 'O';
        } else {
            winner = 'Empate';
        }
        this.seriesWinner = winner;
        this.showLeaderboard(winner);
    }

    updateBoard(board) {
        const cells = this.board.children;
        for (let i = 0; i < cells.length; i++) {
            const cell = cells[i];
            cell.textContent = board[i] || '';
            cell.className = 'cell';
            if (board[i]) {
                cell.classList.add(board[i].toLowerCase());
                // Aplica el color personalizado solo a tu símbolo
                if ((this.isSinglePlayer && board[i] === this.playerSymbol) ||
                    (!this.isSinglePlayer && board[i] === this.playerSymbol)) {
                    cell.style.color = getComputedStyle(document.documentElement).getPropertyValue('--symbol-color');
                } else {
                    cell.style.color = '';
                }
            } else {
                cell.style.color = '';
            }
        }
    }

    updateScores(scores) {
        this.scores = scores;
        this.scoreX.textContent = scores.X;
        this.scoreO.textContent = scores.O;
        
        // Actualizar puntos basados en victorias
        this.points = {
            X: scores.X * 1000,
            O: scores.O * 1000
        };
    }

    updateRound(round) {
        if (this.roundInfo) {
            this.roundInfo.textContent = `Partida ${round} de ${this.maxRounds}`;
        }
    }

    updateSeriesWinner(seriesWinner) {
        if (this.seriesWinnerInfo) {
            if (seriesWinner) {
                this.seriesWinnerInfo.textContent = `¡Jugador ${seriesWinner} es el ganador absoluto!`;
                this.seriesWinnerInfo.style.display = 'block';
                this.showLeaderboard(seriesWinner);
            } else {
                this.seriesWinnerInfo.style.display = 'none';
            }
        }
    }

    showLeaderboard(winner) {
        // Show confetti
        this.confetti.start();

        // Show leaderboard panel
        this.leaderboardPanel.style.display = 'flex';
        
        // Clear previous entries
        this.leaderboardEntries.innerHTML = '';
        
        // Crear entradas con puntos
        const entries = [
            { player: 'X', score: this.scores.X, points: this.points.X, isWinner: winner === 'X' },
            { player: 'O', score: this.scores.O, points: this.points.O, isWinner: winner === 'O' }
        ].sort((a, b) => b.points - a.points);
        
        // Add entries to leaderboard
        entries.forEach(({ player, score, points, isWinner }) => {
            const entry = document.createElement('div');
            entry.className = 'leaderboard-entry';
            const playerName = player === this.playerSymbol ? 'Tú' : (this.isSinglePlayer ? 'IA' : 'Oponente');
            entry.innerHTML = `
                <span class="player-name">${playerName}${isWinner ? ' 🏆' : ''}</span>
                <span class="player-score">${score} victorias</span>
                <span class="player-points">${points} puntos</span>
            `;
            this.leaderboardEntries.appendChild(entry);
        });

        // Update status
        if (winner === this.playerSymbol) {
            this.status.textContent = "¡Has ganado la serie!";
        } else if (winner === 'Empate') {
            this.status.textContent = "¡La serie ha terminado en empate!";
        } else {
            this.status.textContent = "¡El oponente ha ganado la serie!";
        }
    }

    showError(message) {
        if (this.errorBox) {
            this.errorBox.textContent = message;
            this.errorBox.style.display = 'block';
        } else {
            alert(message);
        }
    }

    clearError() {
        if (this.errorBox) {
            this.errorBox.textContent = '';
            this.errorBox.style.display = 'none';
        }
    }

    abandonGame() {
        // Reset game state
        this.resetGame();
        
        // Show mode selection screen
        this.modeSelection.style.display = 'block';
        this.gameContainer.style.display = 'none';
        
        // Reset UI elements
        this.status.textContent = 'Selecciona un modo de juego';
        this.board.style.pointerEvents = 'none';
        
        // Reset scores and round info
        this.scores = { X: 0, O: 0 };
        this.round = 1;
        this.seriesWinner = null;
        this.updateScores(this.scores);
        this.updateRound(this.round);
        
        if (this.seriesWinnerInfo) {
            this.seriesWinnerInfo.style.display = 'none';
        }
    }

    updateBoardDisplay() {
        const cells = this.board.children;
        for (let i = 0; i < cells.length; i++) {
            cells[i].textContent = this.boardState[i];
            cells[i].className = 'cell';
            if (this.boardState[i]) {
                cells[i].classList.add(this.boardState[i].toLowerCase());
                // Aplica el color personalizado solo a tu símbolo
                if ((this.isSinglePlayer && this.boardState[i] === this.playerSymbol) ||
                    (!this.isSinglePlayer && this.boardState[i] === this.playerSymbol)) {
                    cells[i].style.color = getComputedStyle(document.documentElement).getPropertyValue('--symbol-color');
                } else {
                    cells[i].style.color = '';
                }
            } else {
                cells[i].style.color = '';
            }
        }
    }

    updatePlayerNames(opponentName = 'Player O') {
        const xName = document.getElementById('score-x-name');
        const oName = document.getElementById('score-o-name');
        if (this.isSinglePlayer) {
            if (xName) xName.textContent = this.playerName || 'Tú';
            if (oName) oName.textContent = 'IA';
        } else {
            if (this.playerSymbol === 'X') {
                if (xName) xName.textContent = this.playerName || 'Tú';
                if (oName) oName.textContent = opponentName || 'Jugador O';
            } else {
                if (xName) xName.textContent = opponentName || 'Jugador X';
                if (oName) oName.textContent = this.playerName || 'Tú';
            }
        }
    }

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

    startTurnTimer() {
        if (!this.turnTimerBar || !this.turnTimerContainer) return;
        this.turnTimerContainer.style.display = 'block';
        this.turnTimerBar.style.width = '100%';
        let start = Date.now();
        let duration = this.turnTimerDuration;
        clearInterval(this.turnTimerInterval);
        this.turnTimerInterval = setInterval(() => {
            let elapsed = Date.now() - start;
            let percent = Math.max(0, 1 - elapsed / duration);
            this.turnTimerBar.style.width = (percent * 100) + '%';
            if (percent <= 0) {
                clearInterval(this.turnTimerInterval);
                this.turnTimerContainer.style.display = 'none';
            }
        }, 100);
    }

    stopTurnTimer() {
        if (this.turnTimerContainer) this.turnTimerContainer.style.display = 'none';
        if (this.turnTimerBar) this.turnTimerBar.style.width = '100%';
        clearInterval(this.turnTimerInterval);
    }
}

// Confetti Animation Class
class Confetti {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.animationId = null;
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

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

// Fix: Remove duplicate initialization at the bottom of the file
window.addEventListener('load', () => {
    // Add missing elements if they don't exist
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
    
    // Initialize game only once
    window.game = new Game();
}); 