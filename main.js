"use strict";
// Modules to control application life and create native browser window
const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow = null;
function createMainWindow() {
    // Create the browser window.
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.show();
        return
    }
    mainWindow = new BrowserWindow({
        width: 700,
        height: 550,
        minWidth: 600,
        minHeight: 300,
        // frame: false,
        show: false,
        maximizable: true,
        fullscreen: false,
        resizable: true,
        title: "Disk Cleaner",
        webPreferences: {
            nodeIntegration: true,
            nodeIntegrationInWorker: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    mainWindow.removeMenu();

    // and load the index.html of the app.
    mainWindow.loadFile('index.html');

    // Open the DevTools.
    mainWindow.webContents.openDevTools()

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    mainWindow.webContents.on('new-window', function (e, url) {
        e.preventDefault();
        require('electron').shell.openExternal(url);
    });
}

app.on('ready', () => {
    createMainWindow();
});

app.on('second-instance', () => {
    if (mainWindow) {
        mainWindow.show();
    }
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    app.quit();
});

app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) createMainWindow();
})
