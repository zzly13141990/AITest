const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const net = require('net');

let mainWindow;
let serverProcess;
const SERVER_PORT = 3001;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'electron-preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true
    },
    icon: path.join(__dirname, 'build', 'icon.ico')
  });

  // Development: load Vite dev server, Production: load built files
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function startBackendServer() {
  return new Promise((resolve, reject) => {
    // Check if port is in use
    const testServer = net.createServer();
    
    testServer.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log('Server port occupied, starting anyway...');
        resolve();
      } else {
        reject(err);
      }
    });

    testServer.once('listening', () => {
      testServer.close(() => {
        console.log('Starting backend server...');
        
        // Start the server
        const serverPath = path.join(__dirname, 'backend', 'dist', 'server.js');
        serverProcess = spawn('node', [serverPath], {
          cwd: path.join(__dirname, 'backend'),
          stdio: 'inherit'
        });

        serverProcess.on('error', (err) => {
          console.error('Failed to start server:', err);
          reject(err);
        });

        serverProcess.on('close', (code) => {
          console.log('Server process exited, code:', code);
        });

        // Wait for server to start
        setTimeout(resolve, 2000);
      });
    });

    testServer.listen(SERVER_PORT);
  });
}

app.whenReady().then(async () => {
  try {
    await startBackendServer();
    createWindow();
  } catch (error) {
    console.error('Failed to start:', error);
    createWindow();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});

ipcMain.handle('get-server-url', () => {
  return `http://localhost:${SERVER_PORT}`;
});
