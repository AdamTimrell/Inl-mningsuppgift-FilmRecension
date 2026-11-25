// Share one pool across controllers to reuse connections. Requests queue when all connections are busy.
const mysql = require("mysql2/promise");

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
});

// Controllers use execute with placeholders to bind input as data and prevent SQL injection.
module.exports = pool;
