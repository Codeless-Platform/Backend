const express = require("express");
const fs = require("fs");
const bodyParser = require("body-parser");

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: false }));

// Function to create a folder
function createFolder(folderPath, callback) {
  fs.mkdir(folderPath, (err) => {
    if (err) {
      console.error(`Error creating folder ${folderPath}:`, err);
      return;
    }
    console.log(`Folder "${folderPath}" created successfully!`);
    if (callback) {
      callback();
    }
  });
}

// Function to create a file
function createFile(filePath, content, callback) {
  fs.writeFile(filePath, content, (err) => {
    if (err) {
      console.error(`Error creating file ${filePath}:`, err);
      return;
    }
    console.log(`File "${filePath}" created successfully!`);
    if (callback) {
      callback();
    }
  });
}

// Function to create project folders and files
function createProjectFoldersAndFiles(inputText) {
  createFolder(inputText, () => {
    const folders = [
      "content-types",
      "controllers",
      "documentation",
      "routes",
      "services",
    ];
    folders.forEach((folder) => {
      createFolder(`${inputText}/${folder}`, () => {
        if (
          folder === "controllers" ||
          folder === "routes" ||
          folder === "services"
        ) {
          createFile(`${inputText}/${folder}/${inputText}.js`, "", () => {
            console.log(
              `File "${inputText}.js" created successfully in "${folder}" folder!`
            );
          });
        } else if (folder === "content-types") {
          createFolder(`${inputText}/${folder}/${inputText}`, () => {
            createFile(
              `${inputText}/${folder}/${inputText}/schema.json`,
              "",
              () => {
                console.log(
                  `File "schema.json" created successfully in "${folder}/${inputText}" folder!`
                );
              }
            );
          });
        } else {
          createFolder(`${inputText}/${folder}/1.0.0`, () => {
            createFile(
              `${inputText}/${folder}/1.0.0/${inputText}.json`,
              "",
              () => {
                console.log(
                  `File "${inputText}.json" created successfully in "${folder}/1.0.0" folder!`
                );
              }
            );
          });
        }
      });
    });
    console.log("Input text:", inputText);
  });
}

// Function to fill files with content
function fillFiles(inputText) {
  fs.readFile("templates/schema.json", "utf8", (err, data) => {
    if (err) {
      console.error("Error reading file:", err);
      return;
    }
    const newData = data.replace(/abodyyy/g, inputText);
    createFile(
      `${inputText}/content-types/${inputText}/schema.json`,
      newData,
      () => {
        console.log(
          `File "schema.json" created successfully in "content-type/${inputText}" folder!`
        );
      }
    );
  });

  fs.readFile("templates/documentation.json", "utf8", (err, data) => {
    if (err) {
      console.error("Error reading file:", err);
      return;
    }
    const newData = data
      .replace(/abodyyy/g, inputText.toLowerCase())
      .replace(
        /Abodyyy/g,
        inputText.charAt(0).toUpperCase() + inputText.slice(1)
      );
    createFile(
      `${inputText}/documentation/1.0.0/${inputText}.json`,
      newData,
      () => {
        console.log(
          `File "schema.json" created successfully in "content-type/${inputText}" folder!`
        );
      }
    );
  });

  ["controllers.js", "routes.js", "services.js"].forEach((fileName) => {
    fs.readFile("templates/" + fileName, "utf8", (err, data) => {
      if (err) {
        console.error("Error reading file:", err);
        return;
      }
      const newData = data.replace(/abodyyy/g, inputText);
      const folderName = fileName.split(".")[0];
      createFile(`${inputText}/${folderName}/${inputText}.js`, newData, () => {
        console.log(
          `File "${inputText}.js" created successfully in "${folderName}/${inputText}" folder!`
        );
      });
    });
  });
}

app.get("/", (req, res) => {
  res.sendFile("index.html", { root: __dirname });
});

app.post("/submit", (req, res) => {
  const inputText = req.body["inputText"].toLowerCase();
  createProjectFoldersAndFiles(inputText);
  fillFiles(inputText);
  res.redirect("/");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
