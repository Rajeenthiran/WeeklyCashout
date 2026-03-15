const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, 'favicon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  win.loadFile(
    path.join(__dirname, 'dist/cashout-app/browser/index.html')
  );
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

/* ===============================
   PRINT PREVIEW (PDF)
================================ */
ipcMain.handle('print-preview', async () => {
  try {
    if (!win) throw new Error('Main window not initialized');
    const pdfPath = path.join(
      app.getPath('documents'),
      'cashout-preview.pdf'
    );

    const pdfData = await win.webContents.printToPDF({
      printBackground: true,
      pageSize: 'A4'
    });

    fs.writeFileSync(pdfPath, pdfData);

    // Open PDF automatically for preview
    await shell.openPath(pdfPath);

    return { success: true, path: pdfPath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});