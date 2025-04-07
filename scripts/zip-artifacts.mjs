import archiver from "archiver";
import fs from "fs";
import packageInfo from "../package.json" with { type: "json" };

const directories = [
  "dist/",
  // Add more directories as needed
];

let files = [
  "package-lock.json",
  "package.json",
  // Add more files or directories as needed
];

const outputFileName = `deltares-${packageInfo.name}-${packageInfo.version}.zip`;
const output = fs.createWriteStream(outputFileName);
const archive = archiver("zip", {
  zlib: { level: 9 }, // Sets the compression level
});

// Function to recursively get all files and directories within a directory
const getAllFiles = (dir) => {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  let fileList = [];

  files.forEach(file => {
      const filePath = `${dir}/${file.name}`;
      if (file.isDirectory()) {
          fileList = fileList.concat(getAllFiles(filePath)); // Recursively get files from subdirectories
      } else {
          fileList.push(filePath);
      }
  });

  return fileList;
};

directories.forEach(directory => {
  files = files.concat(getAllFiles(directory));
});

output.on("close", () => {
  console.log(archive.pointer() + " total bytes");
});

output.on("end", () => {
  console.log("Data has been drained");
});

archive.on("warning", (err) => {
  if (err.code === "ENOENT") {
    console.warn(err);
  } else {
    throw err;
  }
});

archive.on("error", (err) => {
  throw err;
});

archive.pipe(output);

files.forEach((file) => {
  archive.file(file, { name: file });
});

archive.finalize();
