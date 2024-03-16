const fs = require("fs").promises;
const path = require("path");
const [, , host, user, database, port, tableName] = process.argv;

const basePath = "src/api/";

const incomingData = {
  customAttribute1: { type: "string", required: true },
  customAttribute2: { type: "number", required: false },
  customAttribute3: { type: "boolean", required: true },
};
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
  const folders = [
    "content-types",
    "controllers",
    "documentation",
    "routes",
    "services",
  ];

  try {
    await createFolder(`${basePath}${inputText}`);
    for (const folder of folders) {
      await createFolder(`${basePath}${inputText}/${folder}`);
      if (
        folder === "controllers" ||
        folder === "routes" ||
        folder === "services"
      ) {
        await createFile(
          `${basePath}${inputText}/${folder}/${inputText}.js`,
          ""
        );
        console.log(
          `File "${inputText}.js" created successfully in "${folder}" folder!`
        );
      } else if (folder === "content-types") {
        await createFolder(`${basePath}${inputText}/${folder}/${inputText}`);
        await createFile(
          `${basePath}${inputText}/${folder}/${inputText}/schema.json`,
          ""
        );
        console.log(
          `File "schema.json" created successfully in "${folder}/${inputText}" folder!`
        );
      } else {
        await createFolder(`${basePath}${inputText}/${folder}/1.0.0`);
        await createFile(
          `${basePath}${inputText}/${folder}/1.0.0/${inputText}.json`,
          ""
        );
        console.log(
          `File "${inputText}.json" created successfully in "${folder}/1.0.0" folder!`
        );
      }
    }
    console.log("Input text:", inputText);
  } catch (err) {
    console.error("Error creating project folders and files:", err);
  }
}

async function fillFiles(inputText) {
  try {
    const schemaData = await fs.readFile("templates/schema.json", "utf8");
    const schemaNewData = schemaData.replace(/abodyyy/g, inputText);
    await createFile(
      `${basePath}${inputText}/content-types/${inputText}/schema.json`,
      schemaNewData
    );
    console.log(
      `File "schema.json" created successfully in "content-type/${inputText}" folder!`
    );

    const documentationData = await fs.readFile(
      "templates/documentation.json",
      "utf8"
    );
    const documentationNewData = documentationData
      .replace(/abodyyy/g, inputText.toLowerCase())
      .replace(
        /Abodyyy/g,
        inputText.charAt(0).toUpperCase() + inputText.slice(1)
      );
    await createFile(
      `${basePath}${inputText}/documentation/1.0.0/${inputText}.json`,
      documentationNewData
    );
    console.log(
      `File "schema.json" created successfully in "content-type/${inputText}" folder!`
    );

    const fileNames = ["controllers.js", "routes.js", "services.js"];
    for (const fileName of fileNames) {
      const data = await fs.readFile(`templates/${fileName}`, "utf8");
      const newData = data.replace(/abodyyy/g, inputText);
      const folderName = fileName.split(".")[0];
      await createFile(
        `${basePath}${inputText}/${folderName}/${inputText}.js`,
        newData
      );
      console.log(
        `File "${inputText}.js" created successfully in "${folderName}/${inputText}" folder!`
      );
    }
  } catch (err) {
    console.error("Error filling files:", err);
  }
}

async function updateJSONFile(inputText) {
  try {
    const data = await fs.readFile(
      `${basePath}${inputText}/content-types/${inputText}/schema.json`,
      "utf8"
    );
    const existingJSON = JSON.parse(data);
    existingJSON.attributes.email = { type: "string", required: true };
    existingJSON.attributes.password = { type: "password", required: true };
    const updatedJSONString = JSON.stringify(existingJSON, null, 2);
    await fs.writeFile(
      `${basePath}${inputText}/content-types/${inputText}/schema.json`,
      updatedJSONString,
      "utf8"
    );
    console.log("JSON file updated successfully.");
  } catch (err) {
    console.error("Error updating JSON file:", err);
  }
}
async function updateJSONFile(inputText, customAttributes, columns) {
  try {
    const data = await fs.readFile(
      `${basePath}${inputText}/content-types/${inputText}/schema.json`,
      "utf8"
    );
    const existingJSON = JSON.parse(data);

    for (const attributeName in customAttributes) {
      const { type, required } = customAttributes[attributeName];
      existingJSON.attributes[attributeName] = { type, required };
    }

    for (const column of columns) {
      if (!(column.name in customAttributes)) {
        existingJSON.attributes[column.name] = {
          type: column.type,
          required: false,
        };
      }
    }

    const updatedJSONString = JSON.stringify(existingJSON, null, 2);
    await fs.writeFile(
      `${basePath}${inputText}/content-types/${inputText}/schema.json`,
      updatedJSONString,
      "utf8"
    );
    console.log("JSON file updated successfully.");
  } catch (err) {
    console.error("Error updating JSON file:", err);
  }
}
// Example usage:

async function habraKdbra(inputText) {
  await createProjectFoldersAndFiles(inputText);
  await fillFiles(inputText);
  await updateJSONFile(inputText, incomingData);
}

module.exports = {
  createProjectFoldersAndFiles,
  fillFiles,
  updateJSONFile,
};
