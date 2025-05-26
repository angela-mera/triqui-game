const { pool } = require('../config/database');

class Player {
    // Crear un nuevo jugador
    static async create(playerData) {
        try {
            const [result] = await pool.execute(
                'INSERT INTO players (username, wins, losses, draws) VALUES (?, ?, ?, ?)',
                [playerData.username, playerData.wins || 0, playerData.losses || 0, playerData.draws || 0]
            );
            return result.insertId;
        } catch (error) {
            console.error('Error al crear jugador:', error);
            throw error;
        }
    }

    // Buscar jugador por ID
    static async findById(playerId) {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM players WHERE id = ?',
                [playerId]
            );
            return rows[0];
        } catch (error) {
            console.error('Error al buscar jugador:', error);
            throw error;
        }
    }

    // Buscar jugador por username
    static async findByUsername(username) {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM players WHERE username = ?',
                [username]
            );
            return rows[0];
        } catch (error) {
            console.error('Error al buscar jugador por username:', error);
            throw error;
        }
    }

    // Actualizar estadísticas del jugador
    static async updateStats(playerId, stats) {
        try {
            const [result] = await pool.execute(
                'UPDATE players SET wins = wins + ?, losses = losses + ?, draws = draws + ? WHERE id = ?',
                [stats.wins || 0, stats.losses || 0, stats.draws || 0, playerId]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error al actualizar estadísticas:', error);
            throw error;
        }
    }

    // Obtener ranking de jugadores
    static async getRanking(limit = 10) {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM players ORDER BY wins DESC, draws DESC LIMIT ?',
                [limit]
            );
            return rows;
        } catch (error) {
            console.error('Error al obtener ranking:', error);
            throw error;
        }
    }
}

module.exports = Player; 