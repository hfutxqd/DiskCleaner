const path = require('path');
const fs = require('fs');
const format = require('date-format');


var itemCount = 0;
var peddingStop = false;

function getFile(fpath, recursive = true) {
    fpath = path.resolve(fpath);
    let realpath = fs.realpathSync(fpath);
    let status = fs.lstatSync(realpath);
    if (status.isFile()) {
        return {
            path: fpath,
            name: path.basename(fpath),
            type: "file",
            mtime: format.asString('yyyy-MM-dd hh:mm:ss', status.mtime),
            size: status.size
        }
    } else if (status.isSymbolicLink()) {
        if (recursive) {
            return getFile(fpath);
        } else {
            return {
                path: fpath,
                name: path.basename(fpath),
                type: "link",
                mtime: format.asString('yyyy-MM-dd hh:mm:ss', status.mtime),
                size: status.size
            }
        }
    } else if (status.isDirectory()) {
        return {
            path: fpath,
            name: path.basename(fpath),
            type: "dir",
            mtime: format.asString('yyyy-MM-dd hh:mm:ss', status.mtime),
            size: status.size
        }
    } else {
        return {
            path: fpath,
            name: path.basename(fpath),
            type: "other",
            mtime: format.asString('yyyy-MM-dd hh:mm:ss', status.mtime),
            size: status.size
        }
    }
}

function readDir(dir, callback) {
    dir = path.resolve(dir);
    if (callback && itemCount % 100 === 0) {
        callback([itemCount, dir]);
    }
    let fileTree = getFile(dir, false);
    if (fileTree.type != 'dir') {
        return fileTree;
    }
    let count = 0;
    let files = fs.readdirSync(dir);
    fileTree.subs = [];
    fileTree.count = 0;
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

function rm(fpath, callback) {
    if (callback) {
        callback(fpath);
    }
    let status = fs.lstatSync(fpath);
    if (status.isFile() || status.isSymbolicLink()) {
        console.log('rm -> ' + fpath);
        fs.unlinkSync(fpath);
        return fpath;
    } else if (status.isDirectory()) {
        let files = fs.readdirSync(fpath);
        for (let i = 0; i < files.length; i++) {
            rm(path.resolve(fpath, files[i]), callback);
        }
        console.log('rm -> ' + fpath);
        fs.rmdirSync(fpath);
        return fpath;
    }
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
    rm: (file, callback) => {
        return rm(file, callback);
    },
    ls: (dir) => {
        let realdir = fs.realpathSync(dir);
        console.log('realpath=' + realdir);
        let files = fs.readdirSync(realdir);
        let resFiles = [];
        for (let i = 0; i < files.length; i++) {
            let file = files[i];
            let filePath = path.resolve(dir, file);
            try {
                file = getFile(filePath);
                resFiles.push(file);
            } catch (e) {

            }
        }
        return {
            dir: dir,
            files: resFiles
        };
    },
    currentCount: () => {
        return itemCount;
    }
}
