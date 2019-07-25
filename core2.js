const path = require('path');
const fs = require('fs');
const util = require('util');
const format = require('date-format');

const promisify_lstat = util.promisify(fs.lstat);
const promisify_readdir = util.promisify(fs.readdir);

function getFile(fpath, recursive = true) {
    fpath = path.resolve(fpath);
    let realpath = fs.realpathSync(fpath);
    return promisify_lstat(realpath)
        .then(status => {
            if (status.isFile()) {
                return Promise.resolve({
                    path: fpath,
                    name: path.basename(fpath),
                    type: "file",
                    mtime: format.asString('yyyy-MM-dd hh:mm:ss', status.mtime),
                    size: status.size
                });
            } else if (status.isSymbolicLink()) {
                if (recursive) {
                    return getFile(fpath);
                } else {
                    return Promise.resolve({
                        path: fpath,
                        name: path.basename(fpath),
                        type: "link",
                        mtime: format.asString('yyyy-MM-dd hh:mm:ss', status.mtime),
                        size: status.size
                    });
                }
            } else if (status.isDirectory()) {
                return Promise.resolve({
                    path: fpath,
                    name: path.basename(fpath),
                    type: "dir",
                    mtime: format.asString('yyyy-MM-dd hh:mm:ss', status.mtime),
                    size: status.size
                });
            } else {
                return Promise.resolve({
                    path: fpath,
                    name: path.basename(fpath),
                    type: "other",
                    mtime: format.asString('yyyy-MM-dd hh:mm:ss', status.mtime),
                    size: status.size
                });
            }
        });
}

var itemCount = 0;
var totalSize = 0;
var penddingStop = false;

function readDir(dir, callback) {
    dir = path.resolve(dir);
    itemCount++;
    if (callback && (itemCount < 2000 
                    || itemCount < 20000 && parseInt(Math.random() * 100) === 0 
                    || parseInt(Math.random() * 300) === 0)) {
        callback({
            count: itemCount,
            size: totalSize,
            path: dir
        });
    }
    return getFile(dir, false)
        .then(fileTree => {
            if (fileTree.type != 'dir') {
                return Promise.resolve(fileTree);
            } else if (penddingStop) {
                return Promise.resolve(fileTree)
                    .then(fileTree => {
                        fileTree.subs = [];
                        fileTree.size = 0;
                        fileTree.count = 0;
                        return Promise.resolve(fileTree);
                    });
            }

            let count = 0;
            return promisify_readdir(dir)
                .then(async (files) => {
                    fileTree.subs = [];
                    fileTree.count = 0;
                    let size = 0;
                    for (let i = 0; i < files.length; i++) {
                        try {
                            if (penddingStop) {
                                break;
                            }
                            let file = files[i];
                            let currentPath = path.resolve(dir, file);
                            let status = await promisify_lstat(currentPath);
                            totalSize += status.size;
                            let tree = await readDir(currentPath, callback);
                            fileTree.subs.push(tree);
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
                    return Promise.resolve(fileTree);
                });
        });

}

var rmCount = 0;
function rm(fpath, callback) {
    if (callback) {
        callback(fpath, rmCount);
    }
    rmCount++;
    return promisify_lstat(fpath)
        .then(status => {
            if (status.isFile() || status.isSymbolicLink()) {
                console.log('rm -> ' + fpath);
                fs.unlinkSync(fpath);
                return Promise.resolve({
                    count: rmCount,
                    path: fpath
                });
            } else if (status.isDirectory()) {
                let files = fs.readdirSync(fpath);
                for (let i = 0; i < files.length; i++) {
                    rm(path.resolve(fpath, files[i]), callback);
                }
                console.log('rm -> ' + fpath);
                fs.rmdirSync(fpath);
                return Promise.resolve({
                    count: rmCount,
                    path: fpath
                });
            }
        });
}

 async function ls(dir) {
    let realdir = fs.realpathSync(dir);
    console.log('realpath=' + realdir);
    let files = fs.readdirSync(realdir);
    let resFiles = [];
    for (let i = 0; i < files.length; i++) {
        let file = files[i];
        let filePath = path.resolve(dir, file);
        try {
            file = await getFile(filePath);
            resFiles.push(file);
        } catch (e) {

        }
    }
    return Promise.resolve({
        dir: dir,
        files: resFiles
    });
 }

module.exports = {
    scanDir: (dir, callback) => {
        itemCount = 0;
        totalSize = 0;
        penddingStop = false;
        return readDir(dir, callback);
    },
    stop: () => {
        penddingStop = true;
    },
    rm: (file, callback) => {
        rmCount = 0;
        return rm(file, callback);
    },
    ls: ls,
    currentCount: () => {
        return Promise.resolve(itemCount);
    },
    isPenddingStop: () => {
        return penddingStop;
    }
}

// async function test() {
//     console.log(await readDir('/Users/imxqd', result => {
//         console.log(result);
//     }));
// }

// penddingStop = false;
// test();
