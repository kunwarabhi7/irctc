import mysql from 'mysql';


const db = mysql.createConnection({
    host: 'localhost',
    user: 'admin',
    password: 'Password123#@!',
    database: 'booking_schema'
});


export default db;