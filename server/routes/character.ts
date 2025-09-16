import { Router, RequestHandler } from "express";
import fs from "fs";
import path from "path";

const basePath = "public/templates";
const getFolderList = (dirPath) => {
  return fs
    .readdirSync(dirPath, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);
};

const getFilesInFolder = (folderPath) => {
  return fs.readdirSync(folderPath, { withFileTypes: true })
    .filter(dirent => dirent.isFile())
    .map(dirent => dirent.name);
};

const router = Router();

export const getCharacter: RequestHandler = async (req, res) => {
  try {
    const folders = getFolderList(basePath);
    const filesByFolder = folders.reduce((acc, folder) => {
      const files = getFilesInFolder(path.join(basePath, folder));
      acc[folder] = files;
      return acc;
    }, {});
    res.send(filesByFolder);
    return
  } catch {
    console.log("error");
  }
};

router.get("/list", getCharacter);

export default router;
