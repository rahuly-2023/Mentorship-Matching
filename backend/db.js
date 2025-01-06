const mysql = require('mysql2');

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER, // replace with your MySQL username
    password: process.env.DB_PASSWORD, // replace with your MySQL password
    database: process.env.DB_NAME,
});

console.log("db success");

module.exports = pool.promise(); // Use promise-based API