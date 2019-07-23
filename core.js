const path = require('path');
const fs = require('fs');
const format = require('date-format');


var itemCount = 0;
var peddingStop = false;

function readDir(dir, callback) {
    dir = path.resolve(dir);
    if (callback && itemCount % 100 === 0) {
        callback([itemCount, dir]);
    }
    let status = fs.lstatSync(dir);
    if (status.isFile()) {
        return {
            path: dir,
            name: dir.substr(dir.lastIndexOf('/') + 1),
            type: "file",
            mtime: format.asString('yyyy-MM-dd hh:mm:ss', status.mtime),
            size: status.size
        }
    } else if (status.isSymbolicLink()) {
        return {
            path: dir,
            name: dir.substr(dir.lastIndexOf('/') + 1),
            type: "link",
            mtime: format.asString('yyyy-MM-dd hh:mm:ss', status.mtime),
            size: status.size
        }
    }
    let count = 0;
    let files = fs.readdirSync(dir);
    let fileTree = {
        path: dir,
        name: dir.substr(dir.lastIndexOf('/') + 1),
        type: "dir",
        mtime: format.asString('yyyy-MM-dd hh:mm:ss', status.mtime),
        subs: [],
        size: 0,
        count: 0
    }
    if (peddingStop) {
        return fileTree;
    }
    let size = 0;
    for (let i = 0; i < files.length; i++) {
        try {
            let file = files[i];
            let currentPath = path.resolve(dir, file);
            let status = fs.lstatSync(currentPath);
            let tree = readDir(currentPath, callback);
            fileTree.subs.push(tree);
            itemCount++;
            if (status.isFile()) {
                size += status.size;
                count++;
            } else if (status.isDirectory()) {
                size += tree.size;
                count += tree.count;
            } else if (status.isSymbolicLink()) {
                size += status.size;
                count++;
            }
            // console.log(file);
        } catch (e) {
            console.error(e);
        }
    }
    fileTree.size = size;
    fileTree.count = count;
    return fileTree;
}

module.exports = {
    scanDir: (dir, callback) => {
        itemCount = 0;
        peddingStop = false;
        return readDir(dir, callback);
    },
    stop: () => {
        peddingStop = true;
    },
    ls: (dir) => {
        let files = fs.readdirSync(dir);
        for (let i = 0; i < files.length; i++) {
            let file = files[i];
            let filePath = path.resolve(dir, file);
            let status = fs.lstatSync(filePath);
            if (status.isFile() || status.isBlockDevice() 
                || status.isCharacterDevice() || status.isSocket()) {
                files[i] = {
                    path: filePath,
                    name: file,
                    type: "file",
                    mtime: format.asString('yyyy-MM-dd hh:mm:ss', status.mtime),
                    size: status.size
                }
            } else if (status.isSymbolicLink()) {
                files[i] = {
                    path: filePath,
                    name: file,
                    type: "link",
                    mtime: format.asString('yyyy-MM-dd hh:mm:ss', status.mtime),
                    size: status.size
                }
            } else {
                files[i] = {
                    path: filePath,
                    name: file,
                    type: "dir",
                    mtime: format.asString('yyyy-MM-dd hh:mm:ss', status.mtime),
                    size: status.size
                }
            }
        }
        return files;
    },
    currentCount: () => {
        return itemCount;
    }
}
