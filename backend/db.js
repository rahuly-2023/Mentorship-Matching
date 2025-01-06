const mysql = require('mysql2');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root', // replace with your MySQL username
    password: 'rahul', // replace with your MySQL password
    database: 'mentorship_db',
});

console.log("db success");

module.exports = pool.promise(); // Use promise-based API