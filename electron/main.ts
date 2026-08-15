import 'dotenv/config'

import { app, BrowserWindow, ipcMain, Menu } from 'electron'
import { autoUpdater } from 'electron-updater'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import {
  getMailboxes,
  getUserInbox,
  getUserMessageContent,
  getMailboxQuota,
  getMessageAttachment,
} from './services/hostinger'

import type { MailFolder } from '../src/types/mail'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Configure Auto Updater
autoUpdater.autoDownload = true
autoUpdater.autoInstallOnAppQuit = true

function setupAutoUpdater() {
  autoUpdater.on('checking-for-update', () => {
    win?.webContents.send('updater:status', { status: 'checking' })
  })

  autoUpdater.on('update-available', (info) => {
    win?.webContents.send('updater:status', { status: 'available', info })
  })

  autoUpdater.on('update-not-available', (info) => {
    win?.webContents.send('updater:status', { status: 'not-available', info })
  })

  autoUpdater.on('download-progress', (progress) => {
    win?.webContents.send('updater:status', { status: 'downloading', progress })
  })

  autoUpdater.on('update-downloaded', (info) => {
    win?.webContents.send('updater:status', { status: 'downloaded', info })
  })

  autoUpdater.on('error', (err) => {
    win?.webContents.send('updater:status', {
      status: 'error',
      error: err?.message || String(err),
    })
  })
}

setupAutoUpdater()

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null

ipcMain.handle('app:get-version', () => {
  return app.getVersion()
})

// Updater IPC Handlers
ipcMain.handle('updater:check', async () => {
  if (!app.isPackaged) {
    return { status: 'dev', message: 'Auto-update is disabled in development mode' }
  }
  try {
    return await autoUpdater.checkForUpdates()
  } catch (err: any) {
    return { status: 'error', error: err?.message || String(err) }
  }
})

ipcMain.handle('updater:download', async () => {
  if (!app.isPackaged) {
    return { status: 'dev' }
  }
  return await autoUpdater.downloadUpdate()
})

ipcMain.handle('updater:quit-and-install', () => {
  autoUpdater.quitAndInstall()
})

// Hostinger IPC
ipcMain.handle(
  'hostinger:me',
  async () => {
    return await getMailboxes()
  }
)

ipcMain.handle(
  'hostinger:userinbox',
  async (
    _event,
    mailboxResourceId: string,
    folder: MailFolder,
    hostingerAccount: 'DMBB' | 'DBB',
    page = 1,
    perPage = 10
  ) => {
    return getUserInbox(
      mailboxResourceId,
      folder,
      hostingerAccount,
      page,
      perPage
    )
  }
)

ipcMain.handle(
  'hostinger:usermessagecontent',
  async (
    _event,
    mailboxResourceId: string,
    folder: string,
    uid: number,
    hostingerAccount: 'DMBB' | 'DBB'
  ) => {
    return await getUserMessageContent(
      mailboxResourceId,
      folder,
      uid,
      hostingerAccount
    )
  }
)

ipcMain.handle(
  'hostinger:get-mailbox-quota',
  async (
    _event,
    mailboxResourceId: string,
    hostingerAccount: 'DMBB' | 'DBB',
  ) => {
    return await getMailboxQuota(
      mailboxResourceId,
      hostingerAccount,
    )
  },
)

ipcMain.handle(
  'hostinger:getmessageattachment',
  async (
    _event,
    mailboxResourceId: string,
    folder: string,
    uid: number,
    attachmentId: string,
    hostingerAccount: 'DMBB' | 'DBB'
  ) => {
    return await getMessageAttachment(
      mailboxResourceId,
      folder,
      uid,
      attachmentId,
      hostingerAccount
    )
  }
)

function createWindow() {
  createSplash()
  
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'icon1.ico'),
    width: 1200,
    height: 800,
    minWidth: 1200,
    minHeight: 800,

    show: false,

    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
  })

  Menu.setApplicationMenu(null)

  win.webContents.on('before-input-event', (event, input) => {
    if (
      input.control &&
      input.shift &&
      input.key.toLowerCase() === 'i'
    ) {
      event.preventDefault();
      win?.webContents.toggleDevTools();
    }
  });

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', async () => {
    win?.webContents.send(
      'main-process-message',
      new Date().toLocaleString()
    )

    // Keep splash screen visible for at least 3 seconds
    await new Promise(resolve => setTimeout(resolve, 3000))

    if (win && !win.isDestroyed()) {
      win.show()
    }

    if (splash && !splash.isDestroyed()) {
      splash.close()
      splash = null
    }

    if (app.isPackaged) {
      setTimeout(() => {
        autoUpdater.checkForUpdates().catch((err) => {
          console.warn('[AutoUpdater] Startup update check failed:', err)
        })
      }, 4000)
    }
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

let splash: BrowserWindow | null = null

function createSplash() {
  splash = new BrowserWindow({
    width: 360,
    height: 240,
    frame: false,
    resizable: false,
    center: true,
    alwaysOnTop: true,
    show: true,

    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (VITE_DEV_SERVER_URL) {
    splash.loadURL(`${VITE_DEV_SERVER_URL}/loading.html`)
  } else {
    splash.loadFile(
      path.join(RENDERER_DIST, 'loading.html')
    )
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(createWindow)
