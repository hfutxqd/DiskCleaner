const core = require('./core2');

self.addEventListener('message', async function (e) {
    console.log('action: ' + e.data.action);
    if (e.data.action === 'ls') {
        try {
            self.postMessage({
                type: 'ls',
                data: await core.ls(e.data.data)
            });
        } catch (e) {
            self.postMessage({
                type: 'ls',
                error: e.message
            });
        }
    } else if (e.data.action === 'rm') {
        try {
            let res = await core.rm(e.data.data, (fpath, count) => {
                self.postMessage({
                    type: 'rm',
                    progress: 'doing',
                    data: {
                        count: count,
                        path: fpath
                    }
                });
            });
            self.postMessage({
                type: 'rm',
                progress: 'finish',
                data: res
            });
        } catch (e) {
            self.postMessage({
                type: 'rm',
                progress: 'finish',
                error: e.message
            });
        }
    } else if (e.data.action === 'scanDir') {
        let res = await core.scanDir(e.data.data, result => {
            if (!core.isPenddingStop()) {
                self.postMessage({
                    type: 'scanDir',
                    progress: 'doing',
                    data: result
                });
            }
        });
        self.postMessage({
            type: 'scanDir',
            progress: 'finish',
            data: res
        });
    } else if (e.data.action === 'stopScan') {
        core.stop();
        self.postMessage({
            type: 'stopScan'
        });
        console.log('stopScan');
    } else if (e.data.action === 'stopRm') {
        self.postMessage({
            type: 'stopRm'
        });
    }
}, false);