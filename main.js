const {app, BrowserWindow} = require('electron')
const path  = require('path');
const url = require('url');

let w;
app.on('ready', function() {
    w = new BrowserWindow({
      "webPreferences": {"webSecurity": false}
    });

    w.loadURL(url.format({
        pathname: path.join(__dirname, 'electron.html'),
        protocol: 'file:',
        slashes: true
    }));

    w.webContents.openDevTools();
    w.on('closed', () => w = null);
});
app.on('window-all-closed', () => app.quit());
