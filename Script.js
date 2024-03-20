const sqlite3 = require("sqlite3").verbose();
const mysql = require("mysql");
const {createProjectFoldersAndFiles,fillFiles,updateJSONFile,} = require("./content-type");
const sqliteDB = new sqlite3.Database(".tmp/data.db");


//////////////////------------- fill these dep on your mysql variables -------------/////////////////
// Read required parameters from environment variables
const mysqlHost = process.env.MYSQL_HOST || 'localhost';
const mysqlUser = process.env.MYSQL_USER || 'root';
const mysqlDatabase = process.env.MYSQL_DATABASE || 'myStrapi';
const mysqlPort = process.env.MYSQL_PORT || '8080';
const tableName = process.env.MYSQL_TABLE_NAME || 'product' ;
const password = process.env.MYSQL_PASSWORD || '';

// Check if required parameters are provided
if (!tableName) {
  console.error("Error: Please provide the table name in the environment variable MYSQL_TABLE_NAME.");
  process.exit(1);
}

// Create MySQL connection
const mysqlConnection = mysql.createConnection({
  host: mysqlHost,
  user: mysqlUser,
  database: mysqlDatabase,
  port: parseInt(mysqlPort),
  password : ''
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



async function transferData() {

  // Select query to get data from external database
  const results = await new Promise((resolve, reject) => {
      mysqlConnection.query(`SELECT * FROM ${tableName}`, (error, results, fields) => {
          if (error) {
              console.error("Error fetching data from MySQL:", error);
              reject(error);
          } else {
              resolve(results);
          }
      });
  });

  // Inserting extracted data into strapi database
  for (const row of results) {
      debug("Inserting row:", row);

      const headers = Object.keys(row);
      const sqlStatement = `INSERT INTO ${tableName}s (${headers.join(", ")}) VALUES (${headers.map(() => '?').join(', ')})`;
      debug("SQL Statement:", sqlStatement);

      const stmt = sqliteDB.prepare(sqlStatement);
      debug("Prepared Statement:", stmt.sql);

      await new Promise((resolve, reject) => {
          stmt.run(headers.map(header => row[header]), (err) => {
              if (err) {
                  console.error("Error inserting data into SQLite:", err);
                  reject(err);
              } else {
                  resolve();
              }
          });
          stmt.finalize();
      });
  }

  debug("Data transfer to SQLite completed.");
}




async function run() {
  try {
    const tableSchema = await getTableSchema(tableName);
    const customAttributes = tableSchema.columns.reduce((acc, column) => {
    acc[column.name] = { type: columnTypeToSQLiteType(column.type), required: true };
    console.log(`${column.name} ${columnTypeToSQLiteType(column.type)}`)
    return acc;
    }, {});
    await createTableInSQLite(tableName, tableSchema.columns)
    return { tableName, customAttributes };
  }
        catch (err) {
      console.error("Error in run function:", err);
    }
}

async function createTableInSQLite(tableName, columns) {
  const columnDefinitions = columns.map((column) => {
    let definition = `\`${column.name}\` ${columnTypeToSQLiteType(column.type)}`;
    if (column.Default) {
      definition += ` DEFAULT ${column.Default}`;
    }
    return definition;
  });
  const columnDefinitionString = columnDefinitions.join(", ");

  
  debug(`CREATE TABLE IF NOT EXISTS ${tableName} (\`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL, ${columnDefinitionString}, \`created_at\` datetime NULL, \`updated_at\` datetime NULL, \`published_at\` datetime NULL, \`created_by_id\` integer NULL, \`updated_by_id\` integer NULL, CONSTRAINT \`${tableName}s_created_by_id_fk\` FOREIGN KEY (\`created_by_id\`) REFERENCES \`admin_users\` (\`id\`) ON DELETE SET NULL, CONSTRAINT \`${tableName}s_updated_by_id_fk\` FOREIGN KEY (\`updated_by_id\`) REFERENCES \`admin_users\` (\`id\`) ON DELETE SET NULL, CONSTRAINT \`${tableName}s_created_by_id_fk\` FOREIGN KEY (\`created_by_id\`) REFERENCES \`admin_users\` (\`id\`) ON DELETE SET NULL, CONSTRAINT \`${tableName}s_updated_by_id_fk\` FOREIGN KEY (\`updated_by_id\`) REFERENCES \`admin_users\` (\`id\`) ON DELETE SET NULL)`);


  const stmt = sqliteDB.prepare(
    `CREATE TABLE IF NOT EXISTS ${tableName}s (\`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL, ${columnDefinitionString}, \`created_at\` datetime NULL, \`updated_at\` datetime NULL, \`published_at\` datetime NULL, \`created_by_id\` integer NULL, \`updated_by_id\` integer NULL, CONSTRAINT \`${tableName}_created_by_id_fk\` FOREIGN KEY (\`created_by_id\`) REFERENCES \`admin_users\` (\`id\`) ON DELETE SET NULL, CONSTRAINT \`${tableName}_updated_by_id_fk\` FOREIGN KEY (\`updated_by_id\`) REFERENCES \`admin_users\` (\`id\`) ON DELETE SET NULL, CONSTRAINT \`${tableName}_created_by_id_fk\` FOREIGN KEY (\`created_by_id\`) REFERENCES \`admin_users\` (\`id\`) ON DELETE SET NULL, CONSTRAINT \`${tableName}_updated_by_id_fk\` FOREIGN KEY (\`updated_by_id\`) REFERENCES \`admin_users\` (\`id\`) ON DELETE SET NULL)`
  );
  stmt.run();
  stmt.finalize();
}
function columnTypeToSQLiteType(columnType) {
  if (columnType.includes("int")) return "integer";
  else if (columnType.includes("float") || columnType.includes("double")) return "real";
  else if (columnType.includes("date") || columnType.includes("time")) return "datetime";
  else if (columnType.includes("text")) return "text";
  else if (columnType.includes("blob")) return "blob";
  else return "text";
}


async function habraKdbra() {
  const { tableName, customAttributes } = await run();
  await createProjectFoldersAndFiles(tableName);
  await fillFiles(tableName);
  await updateJSONFile(tableName, customAttributes);
  await transferData();
  process.exit();
}
habraKdbra();

//node Script.js localhost root myStrapi 3306 yup

function debug(...msg) {
  console.log(); console.log("DEBUG:", ...msg); console.log()
}
