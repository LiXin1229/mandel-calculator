import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

let mainWindow = null
const ipcMainHandlers = [] // 存储所有的 ipcMain 监听器处理函数

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 420,
    height: 680,
    minWidth: 300,
    minHeight: 400,
    show: false,
    titleBarStyle: 'hidden',
    frame: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  // 关闭窗口
  const closeMainWindowHandler = () => {
    // 直接结束主进程
    mainWindow.close()
  }
  ipcMain.handle('close-mainWindow', closeMainWindowHandler)
  ipcMainHandlers.push({ event: 'close-mainWindow', handler: closeMainWindowHandler })

  // 最大化
  const checkMaximizedHandler = () => {
    const isMax = mainWindow.isMaximized()
    !isMax ? mainWindow.maximize() : mainWindow.unmaximize()
    return !isMax
  }
  ipcMain.handle('check-maximized', checkMaximizedHandler)
  ipcMainHandlers.push({ event: 'check-maximized', handler: checkMaximizedHandler })

  // 最小化
  const checkMinimizedHandler = () => {
    const isMin = mainWindow.isMinimized()
    !isMin ? mainWindow.minimize() : mainWindow.restore()
  }
  ipcMain.handle('check-minimized', checkMinimizedHandler)
  ipcMainHandlers.push({ event: 'check-minimized', handler: checkMinimizedHandler })

  // 置顶
  const checkTopUpHandler = () => {
    const isTop = mainWindow.isAlwaysOnTop()
    mainWindow.setAlwaysOnTop(!isTop, 'screen')
    return !isTop
  }
  ipcMain.handle('check-topUp', checkTopUpHandler)
  ipcMainHandlers.push({ event: 'check-topUp', handler: checkTopUpHandler })

  mainWindow.on('ready-to-show', () => {
    mainWindow.setTitle('Mandel Computing Unit')
    mainWindow.show()
  })

  mainWindow.on('close', () => {
    ipcMainHandlers.forEach(({ event, handler }) => {
      ipcMain.removeHandler(event, handler)
    })
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
