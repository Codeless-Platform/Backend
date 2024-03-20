const fs = require("fs").promises;
const path = require("path");
const basePath = "src/api/";

/*
// Required Data format
const incomingData = {
  customAttribute1: { type: "string", required: true },
  customAttribute2: { type: "number", required: false },
  customAttribute3: { type: "boolean", required: true },
};
*/
async function handleCreationError(err, folderPath) {
  if (err.code === 'EEXIST') {
      console.log(`Folder "${folderPath}" already exists 😡😡`);
  } else {
      // If it's another error, attempt to delete the folder
      try {
          await fs.rm(`${basePath}${inputText}`, { recursive: true });
          console.log(`Folder "${basePath}${inputText}" deleted.`);
          console.log('Process termination📢🚨🚨');
          process.exit();
      } catch (deleteErr) {
          console.error(`Error deleting folder "${folderPath}":`, deleteErr);
      }
  }
}

async function createFolder(folderPath) {
  try {
    await fs.mkdir(folderPath);
    console.log(`Folder "${folderPath}" created successfully!`);
  } catch (err) {
    console.error(`Error creating folder ${folderPath}:`, err);
    // if error delete the whole api and terminate the process 
    await handleCreationError(err, folderPath);
  }
}


async function createFile(filePath, content) {
  try {
    await fs.writeFile(filePath, content);
    console.log(`File "${filePath}" created successfully!`);
  } catch (err) {
    console.error(`Error creating file ${filePath}:`, err);
    await handleCreationError(err, filePath);
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
}


async function fillFiles(inputText) {  
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
}
// function to fill the attributes from the data base external table 
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
      // Error happens delete the api and terminate the process 
      await fs.rm(`${basePath}${inputText}`, { recursive: true });
      console.log(`Folder "${basePath}${inputText}" deleted.`);
      console.log('Process termination🚨🚨');
  }
}

// async function habraKdbra(inputText) {
//   await createProjectFoldersAndFiles(inputText);
//   await fillFiles(inputText);
//   await updateJSONFile(inputText, incomingData);
// }

module.exports = {
  createProjectFoldersAndFiles,
  fillFiles,
  updateJSONFile,
};
