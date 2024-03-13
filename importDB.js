const sqlite3 = require('sqlite3').verbose();
const mysql = require('mysql');


const [, , host, user, database, port, tableName] = process.argv;


if (!host || !user || !database || !port || !tableName) {
    console.error("Usage: node customScript.js <host> <user> <database> <port> <tableName>");
    process.exit(1);
}

const mysqlConnection = mysql.createConnection({
    host: host,
    user: user,
    database: database,
    port: parseInt(port)
});

const sqliteDB = new sqlite3.Database('.tmp/data.db');

function transferData() {
    mysqlConnection.query(`SELECT * FROM ${tableName}`, (error, results, fields) => {
        if (error) {
            console.error('Error fetching data from MySQL:', error);
            mysqlConnection.end();
            sqliteDB.close();
            return;
        }
    console.log(`tablename: ${tableName}, results: ${results}`)

    results.forEach(row => {
        Object.keys(row).forEach(key => {
            console.log(`${key}: ${row[key]}`);
        });
        console.log("====================");
    });
        const headers = []
        Object.keys(results[0]).forEach(key =>{
            headers.push(key);
        });
        
        results.forEach(row => {
            const stmt = sqliteDB.prepare(`INSERT INTO ${tableName} (${headers[0]}, ${headers[1]}) VALUES (?, ?)`);
            stmt.run(row[headers[0]], row[headers[1]], (err) => {
                if (err) {
                    console.error('Error inserting data into SQLite:', err);
                }
            });

            stmt.finalize();
        });
        

        console.log('Data transfer completed.');

        mysqlConnection.end();
        sqliteDB.close();
    });
}

transferData();
