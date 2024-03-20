const sqlite3 = require("sqlite3").verbose();
const mysql = require("mysql");
const {createProjectFoldersAndFiles,fillFiles,updateJSONFile,} = require("./content-type");
const sqliteDB = new sqlite3.Database(".tmp/data.db");


//////////////////------------- fill these dep on your mysql variables -------------/////////////////
// Read required parameters from environment variables
const mysqlHost = process.env.MYSQL_HOST || 'localhost';
const mysqlUser = process.env.MYSQL_USER || 'root';
const mysqlDatabase = process.env.MYSQL_DATABASE || 'strapi';
const mysqlPort = process.env.MYSQL_PORT || 3306;
const tableName = process.env.MYSQL_TABLE_NAME || 'mmmmmmmmm' ;
const password = process.env.MYSQL_PASSWORD || 'Mohamedlimo236';

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
  password: password,
  authPlugins: {
    mysql_clear_password: () => () => Buffer.from(password + '\0')
  }
});

// Rest of your script remains the same...


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
    console.log(`table schema column:`);
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
    `CREATE TABLE IF NOT EXISTS ${tableName} (\`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL, ${columnDefinitionString}, \`created_at\` datetime NULL, \`updated_at\` datetime NULL, \`published_at\` datetime NULL, \`created_by_id\` integer NULL, \`updated_by_id\` integer NULL, CONSTRAINT \`${tableName}_created_by_id_fk\` FOREIGN KEY (\`created_by_id\`) REFERENCES \`admin_users\` (\`id\`) ON DELETE SET NULL, CONSTRAINT \`${tableName}_updated_by_id_fk\` FOREIGN KEY (\`updated_by_id\`) REFERENCES \`admin_users\` (\`id\`) ON DELETE SET NULL, CONSTRAINT \`${tableName}_created_by_id_fk\` FOREIGN KEY (\`created_by_id\`) REFERENCES \`admin_users\` (\`id\`) ON DELETE SET NULL, CONSTRAINT \`${tableName}_updated_by_id_fk\` FOREIGN KEY (\`updated_by_id\`) REFERENCES \`admin_users\` (\`id\`) ON DELETE SET NULL)`
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
  process.exit();
}
habraKdbra()

//node Script.js localhost root myStrapi 3306 yup
