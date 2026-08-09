import 'dotenv/config'

import { app, BrowserWindow, ipcMain, Menu, globalShortcut } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import {
  getMailboxes,
  getUserInbox,
  getUserMessageContent,
} from './services/hostinger'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

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
    folder: string,
    hostingerAccount: 'DMBB' | 'DBB'
  ) => {
    return await getUserInbox(
      mailboxResourceId,
      folder,
      hostingerAccount
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

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    width: 1200,
    height: 800,
    minWidth: 1200,
    minHeight: 800,

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
      win.webContents.toggleDevTools();
    }
  });

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
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
