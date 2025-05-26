-- Crear base de datos
CREATE DATABASE IF NOT EXISTS tictactoe_db;
USE tictactoe_db;

-- Tabla de jugadores
CREATE TABLE IF NOT EXISTS players (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    wins INT DEFAULT 0,
    losses INT DEFAULT 0,
    draws INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de juegos
CREATE TABLE IF NOT EXISTS games (
    id INT PRIMARY KEY AUTO_INCREMENT,
    player1_id INT,
    player2_id INT,
    board JSON,
    current_player VARCHAR(1),
    status ENUM('active', 'completed', 'abandoned') DEFAULT 'active',
    winner VARCHAR(1),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (player1_id) REFERENCES players(id),
    FOREIGN KEY (player2_id) REFERENCES players(id)
);

-- Tabla de movimientos
CREATE TABLE IF NOT EXISTS moves (
    id INT PRIMARY KEY AUTO_INCREMENT,
    game_id INT,
    player_id INT,
    position INT,
    symbol VARCHAR(1),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(id),
    FOREIGN KEY (player_id) REFERENCES players(id)
); 