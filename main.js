const electron = require('electron');
const {app, globalShortcut} = electron;
const WindowManager = require('./script/WindowManager');
const wm = new WindowManager();
const cfg = require('./script/config');

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = true;

let win; // main BrowserWindow

// app init
app.whenReady().then(() => {
	// main window
	win = wm.createWindow();
	wm.renderContent(win, 'main');

	// show window
	win.once('ready-to-show', () => {
		// key for quit
		globalShortcut.register(cfg.QUIT_KEY, () => {
			app.quit();
		});
		win.show();
	});

	// open devTools if env is dev
	if (cfg.isDev()) {
		win.maximize();
		win.webContents.openDevTools();
	}
});
