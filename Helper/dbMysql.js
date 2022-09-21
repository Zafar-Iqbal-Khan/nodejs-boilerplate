const mysql = require('mysql2');
require('dotenv').config();
const { DB_HOST, DB, DB_USER, DB_PASS,MY_SQL_PORT } = process.env;
// create the connection to database
const connection =  ()=>{
return (mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASS,
    database: DB,
    port:MY_SQL_PORT
  }))};

// connection.connect((err) => {
//   if (err) throw err;
//   console.log("connected to mySql");
  // connection().destroy();
// })

// connection().destroy();

module.exports = connection;