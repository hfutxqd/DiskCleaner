const exec = require('child_process').exec;
const fs = require('fs');
const path = require('path');
const iconv = require('iconv-lite');

function getWindowsDrives (callback) {
  if (!callback) {
    throw new Error('getWindowsDrives called with no callback');
  }
  if (process.platform !== 'win32') {
    throw new Error('getWindowsDrives called but process.plaform !== \'win32\'');
  }
  let drives = [];
  // wmic logicaldisk get DeviceID,DriveType,Size,FreeSpace,VolumeName
  // wmic LOGICALDISK LIST BRIEF
  exec('wmic logicaldisk get DeviceID,DriveType,FreeSpace,Size,VolumeName', { encoding: 'buffer' }, (error, stdout) => {
    if (error) {
      callback(error, drives);
      return;
    }
    // get the drives
    const result = iconv.decode(stdout, 'cp936');
    let parts = result.split('\n');
    if (parts.length) {
      // first part is titles; get rid of it
      parts.splice(0, 1);
      for (let index = 0; index < parts.length; ++index) {
        let line = parts[index];
        console.log(line);
        let drive = line.slice(0, 2);
        let matcher = line.match(/(\S+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(.+?)\s*$/);
        if (matcher && matcher[1].length && matcher[1][matcher[1].length - 1] === ':') {
          try {
            // if stat fails, it'll throw an exception
            fs.statSync(drive + path.sep);
            drives.push({
              id: matcher[1],
              type: matcher[2],
              free: matcher[3],
              size: matcher[4],
              name: matcher[5],
            });
          }
          catch (e) {
            console.error(`Cannot stat windows drive: ${drive}`, e);
          }
        }
      }
      callback(null, drives);
    }
  })
}

getWindowsDrives((error, drivers) => {
  console.log(drivers);
});

// export default getWindowsDrives
