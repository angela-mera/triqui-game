const { pool } = require('../config/database');

class Game {
    // Crear un nuevo juego
    static async create(gameData) {
        try {
            const [result] = await pool.execute(
                'INSERT INTO games (player1_id, player2_id, current_player, status) VALUES (?, ?, ?, ?)',
                [gameData.player1_id, gameData.player2_id, gameData.current_player, gameData.status]
            );
            return result.insertId;
        } catch (error) {
            console.error('Error al crear juego:', error);
            throw error;
        }
    }

    // Obtener un juego por ID
    static async findById(gameId) {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM games WHERE id = ?',
                [gameId]
            );
            return rows[0];
        } catch (error) {
            console.error('Error al buscar juego:', error);
            throw error;
        }
    }

    // Actualizar estado del juego
    static async update(gameId, gameData) {
        try {
            const [result] = await pool.execute(
                'UPDATE games SET board = ?, current_player = ?, status = ?, winner = ? WHERE id = ?',
                [gameData.board, gameData.current_player, gameData.status, gameData.winner, gameId]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error al actualizar juego:', error);
            throw error;
        }
    }

    // Obtener historial de juegos de un jugador
    static async getPlayerHistory(playerId) {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM games WHERE player1_id = ? OR player2_id = ? ORDER BY created_at DESC',
                [playerId, playerId]
            );
            return rows;
        } catch (error) {
            console.error('Error al obtener historial:', error);
            throw error;
        }
    }
}

module.exports = Game; 