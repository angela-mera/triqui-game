const mysql = require('mysql2/promise');

// Configuración de la base de datos
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'tictactoe_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Crear pool de conexiones
const pool = mysql.createPool(dbConfig);

// Función para probar la conexión
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('Conexión a la base de datos establecida correctamente');
        connection.release();
        return true;
    } catch (error) {
        console.error('Error al conectar con la base de datos:', error);
        return false;
    }
}

module.exports = {
    pool,
    testConnection
}; 