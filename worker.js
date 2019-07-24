const core = require('./core');

self.addEventListener('message', function (e) {
    if (e.data.action === 'ls') {
        try {
            self.postMessage({
                type: 'ls',
                data: core.ls(e.data.data)
            });
        } catch (e) {
            self.postMessage({
                type: 'ls',
                error: e.message
            });
        }
    } else if (e.data.action === 'rm') {
        try {
            let res = core.rm(e.data.data, fpath => {
                self.postMessage({
                    type: 'rm',
                    progress: 'doing',
                    data: fpath
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
        let res = core.scanDir(e.data.data, result => {
            self.postMessage({
                type: 'scanDir',
                progress: 'doing',
                data: result
            });
        });
        self.postMessage({
            type: 'scanDir',
            progress: 'finish',
            data: res
        });
    } else if (e.data.action === 'stop') {
        self.postMessage({
            type: 'stop'
        });
    } else if (e.data.action === 'currentCount') {
        self.postMessage({
            type: 'count',
            data: core.currentCount()
        });
    }
}, false);