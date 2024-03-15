// const sqlite3 = require('sqlite3').verbose();
// const mysql = require('mysql');
const fs = require('fs').promises;

const [, , host, user, database, port, tableName] = process.argv;
const basePath = 'src/api/';

const incomingData = {
    customAttribute1: { type: "string", required: true },
    customAttribute2: { type: "number", required: false },
    customAttribute3: { type: "boolean", required: true }
};


// if (!host || !user || !database || !port || !tableName) {
//     console.error("Usage: node customScript.js <host> <user> <database> <port> <tableName>");
//     process.exit(1);
// }

// console.log(`${tableName}`)
// const mysqlConnection = mysql.createConnection({
//     host: host,
//     user: user,
//     database: database,
//     port: parseInt(port)
// });

// const sqliteDB = new sqlite3.Database('.tmp/data.db');

// function transferData() {
//     mysqlConnection.query(`SELECT * FROM ${tableName}`, (error, results, fields) => {
//         if (error) {
//             console.error('Error fetching data from MySQL:', error);
//             mysqlConnection.end();
//             sqliteDB.close();
//             return;
//         }
//     console.log(`tablename: ${tableName}, results: ${results}`)

//     results.forEach(row => {
//         Object.keys(row).forEach(key => {
//             console.log(`${key}: ${row[key]}`);
//         });
//         console.log("====================");
//     });
//         const headers = []
//         Object.keys(results[0]).forEach(key =>{
//             headers.push(key);
//         });
        
//         results.forEach(row => {
//             const stmt = sqliteDB.prepare(`INSERT INTO ${tableName} (${headers[0]}, ${headers[1]}) VALUES (?, ?)`);
//             stmt.run(row[headers[0]], row[headers[1]], (err) => {
//                 if (err) {
//                     console.error('Error inserting data into SQLite:', err);
//                 }
//             });

//             stmt.finalize();
//         });
        

//         console.log('Data transfer completed.');

//         mysqlConnection.end();
//         sqliteDB.close();
//     });
// }


async function createFolder(folderPath) {
    try {
        await fs.mkdir(folderPath);
        console.log(`Folder "${folderPath}" created successfully!`);
    } catch (err) {
        console.error(`Error creating folder ${folderPath}:`, err);
    }
}

async function createFile(filePath, content) {
    try {
        await fs.writeFile(filePath, content);
        console.log(`File "${filePath}" created successfully!`);
    } catch (err) {
        console.error(`Error creating file ${filePath}:`, err);
    }
}

async function createProjectFoldersAndFiles(inputText) {
    const folders = ['content-types', 'controllers', 'documentation', 'routes', 'services'];

    try {
        await createFolder(`${basePath}${inputText}`);
        for (const folder of folders) {
            await createFolder(`${basePath}${inputText}/${folder}`);
            if (folder === 'controllers' || folder === 'routes' || folder === 'services') {
                await createFile(`${basePath}${inputText}/${folder}/${inputText}.js`, '');
                console.log(`File "${inputText}.js" created successfully in "${folder}" folder!`);
            } else if (folder === 'content-types') {
                await createFolder(`${basePath}${inputText}/${folder}/${inputText}`);
                await createFile(`${basePath}${inputText}/${folder}/${inputText}/schema.json`, '');
                console.log(`File "schema.json" created successfully in "${folder}/${inputText}" folder!`);
            } else {
                await createFolder(`${basePath}${inputText}/${folder}/1.0.0`);
                await createFile(`${basePath}${inputText}/${folder}/1.0.0/${inputText}.json`, '');
                console.log(`File "${inputText}.json" created successfully in "${folder}/1.0.0" folder!`);
            }
        }
        console.log('Input text:', inputText);
    } catch (err) {
        console.error('Error creating project folders and files:', err);
    }
}

async function fillFiles(inputText) {
    try {
        const schemaData = await fs.readFile('templates/schema.json', 'utf8');
        const schemaNewData = schemaData.replace(/abodyyy/g, inputText);
        await createFile(`${basePath}${inputText}/content-types/${inputText}/schema.json`, schemaNewData);
        console.log(`File "schema.json" created successfully in "content-type/${inputText}" folder!`);

        const documentationData = await fs.readFile('templates/documentation.json', 'utf8');
        const documentationNewData = documentationData.replace(/abodyyy/g, inputText.toLowerCase()).replace(/Abodyyy/g, inputText.charAt(0).toUpperCase() + inputText.slice(1));
        await createFile(`${basePath}${inputText}/documentation/1.0.0/${inputText}.json`, documentationNewData);
        console.log(`File "schema.json" created successfully in "content-type/${inputText}" folder!`);

        const fileNames = ['controllers.js', 'routes.js', 'services.js'];
        for (const fileName of fileNames) {
            const data = await fs.readFile(`templates/${fileName}`, 'utf8');
            const newData = data.replace(/abodyyy/g, inputText);
            const folderName = fileName.split('.')[0];
            await createFile(`${basePath}${inputText}/${folderName}/${inputText}.js`, newData);
            console.log(`File "${inputText}.js" created successfully in "${folderName}/${inputText}" folder!`);
        }
    } catch (err) {
        console.error('Error filling files:', err);
    }
}

async function updateJSONFile(inputText) {
    try {
        const data = await fs.readFile(`${basePath}${inputText}/content-types/${inputText}/schema.json`, 'utf8');
        const existingJSON = JSON.parse(data);
        existingJSON.attributes.email = { type: "string", required: true };
        existingJSON.attributes.password = { type: "password", required: true };
        const updatedJSONString = JSON.stringify(existingJSON, null, 2);
        await fs.writeFile(`${basePath}${inputText}/content-types/${inputText}/schema.json`, updatedJSONString, 'utf8');
        console.log("JSON file updated successfully.");
    } catch (err) {
        console.error("Error updating JSON file:", err);
    }
}
// fill // update content types attributes
async function updateJSONFile(inputText, customAttributes) {
    try {
        const data = await fs.readFile(`${basePath}${inputText}/content-types/${inputText}/schema.json`, 'utf8');
        const existingJSON = JSON.parse(data);
        
        // Update with custom attributes
        for (const attributeName in customAttributes) {
            const { type, required } = customAttributes[attributeName];
            existingJSON.attributes[attributeName] = { type, required };
        }
        
        const updatedJSONString = JSON.stringify(existingJSON, null, 2);
        await fs.writeFile(`${basePath}${inputText}/content-types/${inputText}/schema.json`, updatedJSONString, 'utf8');
        console.log("JSON file updated successfully.");
    } catch (err) {
        console.error("Error updating JSON file:", err);
    }
}

// Example usage:


async function habrakdbra(inputText) {
    await createProjectFoldersAndFiles(inputText);
    await fillFiles(inputText);
    await updateJSONFile(inputText, incomingData);
}

habrakdbra('last');


// transferData();
