const core = require('./core');

self.addEventListener('message', function (e) {
    if (e.data.action === 'ls') {
        self.postMessage({
            type: 'ls',
            data: core.ls(e.data.data)
        });
    } else if (e.data.action === 'scanDir') {
        let res = core.scanDir(e.data.data, result => {
            self.postMessage({
                type: 'scanning',
                data: result
            });
        });
        self.postMessage({
            type: 'scanFinish',
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