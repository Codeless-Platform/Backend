const sqlite3 = require("sqlite3").verbose();
const mysql = require("mysql");
const [, , host, user, database, port, tableName] = process.argv;
const {createProjectFoldersAndFiles,fillFiles,updateJSONFile,} = require("./content-type");
const sqliteDB = new sqlite3.Database(".tmp/data.db");

if (!host || !user || !database || !port || !tableName) {
  console.error(
    "Usage: node customScript.js <host> <user> <database> <port> <tableName>"
  );
  process.exit(1);
}

console.log(`${tableName}`);
const mysqlConnection = mysql.createConnection({
  host: host,
  user: user,
  database: database,
  port: parseInt(port),
});

async function getTableSchema(tableName) {
  return new Promise((resolve, reject) => {
    mysqlConnection.query(`DESCRIBE \`${tableName}\``,(error, results, fields) => {
        if (error) {
          reject(error);
        } else {
          const tableSchema = {tableName,numColumns: results.length,columns: results.map((column) => ({
              name: column.Field,
              type: column.Type,
            })),
          };
          resolve(tableSchema);
        }
      }
    );
  });
}

function transferData() {
  mysqlConnection.query(`SELECT * FROM ${tableName}`,
    (error, results, fields) => {
      if (error) {
        console.error("Error fetching data from MySQL:", error);
        mysqlConnection.end();
        sqliteDB.close();
        return;
      }
      console.log(`tablename: ${tableName}, results: ${results}`);

      results.forEach((row) => {
        Object.keys(row).forEach((key) => {
          console.log(`${key}: ${row[key]}`);
        });
        console.log("====================");
      });
      const headers = [];
      Object.keys(results[0]).forEach((key) => {
        headers.push(key);
      });

      results.forEach((row) => {
        const stmt = sqliteDB.prepare(
          `INSERT INTO ${tableName} (${headers[0]}, ${headers[1]}) VALUES (?, ?)`
        );
        stmt.run(row[headers[0]], row[headers[1]], (err) => {
          if (err) {
            console.error("Error inserting data into SQLite:", err);
          }
        });

        stmt.finalize();
      });

      console.log("Data transfer completed.");

      mysqlConnection.end();
      sqliteDB.close();
    }
  );
}

async function run() {
  try {
    const tableSchema = await getTableSchema(tableName);
    console.log("Table schema:", tableSchema);
    await createProjectFoldersAndFiles(tableSchema.tableName);
    await fillFiles(tableSchema.tableName);

    const customAttributes = tableSchema.columns.reduce((acc, column) => {
      acc[column.name] = { type: column.type, required: true };
      return acc;
    }, {});

    await updateJSONFile(
      tableSchema.tableName,customAttributes,tableSchema.columns);}
      catch (err) {
    console.error("Error in run function:", err);
  }
}
run();
async function createTableInSQLite(tableName, columns) {
  const columnDefinitions = columns.map((column) => {
    let definition = `${column.name} ${columnTypeToSQLiteType(column.type)}`;
    if (column.Key === "PRI") {
      definition += " PRIMARY KEY";
    }
    if (column.Default) {
      definition += ` DEFAULT ${column.Default}`;
    }
    return definition;
  });
  const columnDefinitionString = columnDefinitions.join(", ");

  const stmt = sqliteDB.prepare(
    `CREATE TABLE IF NOT EXISTS ${tableName} (${columnDefinitionString})`
  );
  stmt.run();
  stmt.finalize();
}

function columnTypeToSQLiteType(columnType) {
  switch (columnType) {
    case "INT":
    case "INT UNSIGNED":
      return "INTEGER";
    case "VARCHAR":
    case "TEXT":
      return "TEXT";
    case "DATETIME":
      return "DATETIME";
    case "TINYINT":
      return "INTEGER";
    default:
      throw new Error(`Unsupported column type: ${columnType}`);
  }
}
//node Script.js localhost root myStrapi 3306 yup
