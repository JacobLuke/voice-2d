import { app, BrowserWindow, ipcMain, systemPreferences, screen } from 'electron';
declare const MAIN_WINDOW_WEBPACK_ENTRY: any;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const display = screen.getPrimaryDisplay();
  const mainWindow = new BrowserWindow({
    width: display.bounds.width / 2,
    height: display.bounds.height,
    x: 0,
    y: 0,
    webPreferences: {
      nodeIntegration: true,
      preload: MAIN_WINDOW_WEBPACK_ENTRY,
    },
  });

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
  const mainWindow2 = new BrowserWindow({
    width: display.bounds.width / 2,
    height: display.bounds.height,
    x: display.bounds.width / 2,
    y: 0,
    webPreferences: {
      nodeIntegration: true,
      preload: MAIN_WINDOW_WEBPACK_ENTRY,
    },
  });

  // and load the index.html of the app.
  mainWindow2.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.



ipcMain.on("requestMicrophone", (event) => {
  const accessCheck = process.platform === "darwin"
    ? systemPreferences.askForMediaAccess("microphone")
    : Promise.resolve(true);
  accessCheck.then(hasAccess => {
    event.reply("requestMicrophone$response", hasAccess);
  });
})