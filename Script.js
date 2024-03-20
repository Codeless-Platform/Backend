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


async function selectQuery() {
  return new Promise((resolve, reject) => {
    mysqlConnection.query(`SELECT * FROM ${tableName}`, (error, results, fields) => {
      if (error) {
        console.error("Error fetching data from MySQL:", error);
        reject(error);
      } else{
        resolve(results);
      }
      
    });
  });
}

async function fillStrapiTable(dataRows) {
  const headers = Object.keys(dataRows[0]); // Assuming dataRows is an array of objects

  // Array to hold all promises for insertions
  const insertPromises = [];

  for (const row of dataRows) {
      console.log("Inserting row:", row); // Debugging statement

      const sqlStatement = `INSERT INTO ${tableName}s (${headers.join(", ")}) VALUES (${headers.map(() => '?').join(', ')})`;
      console.log("SQL Statement:", sqlStatement); // Debugging statement

      const stmt = sqliteDB.prepare(sqlStatement);
      console.log("Prepared Statement:", stmt.sql); // Debugging statement

      // Create a promise for the insertion
      const insertionPromise = new Promise((resolve, reject) => {
          stmt.run(headers.map(header => row[header]), (err) => {
              if (err) {
                  console.error("Error inserting data into SQLite:", err);
                  reject(err); // Reject the promise if there's an error
              } else {
                  console.log("Row inserted successfully."); // Debugging statement
                  resolve(); // Resolve the promise if insertion is successful
              }
          });
          stmt.finalize();
      });

      // Push the insertion promise to the array
      insertPromises.push(insertionPromise);
  }

  // Wait for all insertions to complete
  try {
      await Promise.all(insertPromises);
      console.log("Data transfer to SQLite completed."); // Debugging statement
  } catch (error) {
      console.error("Error in fillStrapiTable:", error);
  }
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

  // DEBUGGING
  console.log(`CREATE TABLE IF NOT EXISTS ${tableName} (\`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL, ${columnDefinitionString}, \`created_at\` datetime NULL, \`updated_at\` datetime NULL, \`published_at\` datetime NULL, \`created_by_id\` integer NULL, \`updated_by_id\` integer NULL, CONSTRAINT \`${tableName}s_created_by_id_fk\` FOREIGN KEY (\`created_by_id\`) REFERENCES \`admin_users\` (\`id\`) ON DELETE SET NULL, CONSTRAINT \`${tableName}s_updated_by_id_fk\` FOREIGN KEY (\`updated_by_id\`) REFERENCES \`admin_users\` (\`id\`) ON DELETE SET NULL, CONSTRAINT \`${tableName}s_created_by_id_fk\` FOREIGN KEY (\`created_by_id\`) REFERENCES \`admin_users\` (\`id\`) ON DELETE SET NULL, CONSTRAINT \`${tableName}s_updated_by_id_fk\` FOREIGN KEY (\`updated_by_id\`) REFERENCES \`admin_users\` (\`id\`) ON DELETE SET NULL)`);


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
  console.log("Invoking Transfer Data");
  const dataRows = await selectQuery();
  await fillStrapiTable(dataRows);
  process.exit();
}
habraKdbra();

//node Script.js localhost root myStrapi 3306 yup
