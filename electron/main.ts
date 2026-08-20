import 'dotenv/config'
import http from 'node:http'
import axios from 'axios'
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
    folder: MailFolder,
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

// -------------------------------------------------------------
// Google OAuth Desktop Loopback IPC Handler
// -------------------------------------------------------------
const DEFAULT_DESKTOP_CLIENT_ID = ''
const DEFAULT_DESKTOP_CLIENT_SECRET = ''

const GMAIL_DESKTOP_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ')

ipcMain.handle(
  'gmail:oauth-login',
  async (_event, options?: { clientId?: string; clientSecret?: string }) => {
    const clientId =
      options?.clientId?.trim() || DEFAULT_DESKTOP_CLIENT_ID

    const clientSecret =
      options?.clientSecret?.trim() || DEFAULT_DESKTOP_CLIENT_SECRET

    return new Promise((resolve, reject) => {
      let serverClosed = false
      let timeoutId: NodeJS.Timeout | null = null
      let assignedRedirectUri = ''
      let oauthWindow: BrowserWindow | null = null
      let oauthCompleted = false

      const closeServerSafely = () => {
        if (!serverClosed) {
          serverClosed = true

          if (timeoutId) {
            clearTimeout(timeoutId)
            timeoutId = null
          }

          try {
            server.close()
          } catch {
            // Ignore close errors
          }
        }
      }

      const closeOAuthWindowSafely = () => {
        if (oauthWindow && !oauthWindow.isDestroyed()) {
          oauthWindow.close()
        }

        oauthWindow = null
      }

      const server = http.createServer(async (req, res) => {
        try {
          const reqUrl = req.url || '/'
          const parsedUrl = new URL(
            reqUrl,
            'http://127.0.0.1'
          )

          const code = parsedUrl.searchParams.get('code')
          const error = parsedUrl.searchParams.get('error')
          const errorDescription =
            parsedUrl.searchParams.get('error_description')

          // ---------------------------------------------------------
          // Google returned an OAuth error
          // Example: access_denied
          // ---------------------------------------------------------
          if (error) {
            oauthCompleted = true

            res.writeHead(200, {
              'Content-Type': 'text/html; charset=utf-8',
            })

            res.end(`
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <title>DBB Mail</title>
              </head>
              <body style="
                margin:0;
                height:100vh;
                display:flex;
                align-items:center;
                justify-content:center;
                font-family:system-ui,sans-serif;
                background:#0a0a0a;
                color:#fafafa;
              ">
                <div style="
                  width:100%;
                  max-width:420px;
                  padding:32px;
                  text-align:center;
                  background:#171717;
                  border:1px solid #262626;
                  border-radius:14px;
                ">
                  <div style="
                    width:44px;
                    height:44px;
                    margin:0 auto 16px;
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    border:1px solid #404040;
                    border-radius:50%;
                    color:#a3a3a3;
                    font-size:20px;
                  ">!</div>

                  <h1 style="
                    margin:0 0 8px;
                    font-size:20px;
                    font-weight:600;
                  ">
                    Authentication Not Completed
                  </h1>

                  <p style="
                    margin:0 0 18px;
                    color:#a3a3a3;
                    font-size:14px;
                    line-height:1.5;
                  ">
                    Google sign-in was not completed.
                    Your DBB Mail account was not connected.
                  </p>

                  <div style="
                    margin-bottom:18px;
                    padding:10px 12px;
                    background:#1c1c1c;
                    border:1px solid #303030;
                    border-radius:8px;
                    color:#a3a3a3;
                    font-size:12px;
                  ">
                    ${errorDescription || error || 'Google authentication was cancelled.'}
                  </div>

                  <div style="
                    display:inline-block;
                    padding:6px 11px;
                    background:#1c1c1c;
                    border:1px solid #303030;
                    border-radius:999px;
                    color:#a3a3a3;
                    font-size:12px;
                  ">
                    You can close this window
                  </div>
                </div>
              </body>
              </html>
            `)

            closeServerSafely()
            closeOAuthWindowSafely()

            return reject(
              new Error(
                errorDescription ||
                  error ||
                  'Google authentication was cancelled.'
              )
            )
          }

          // ---------------------------------------------------------
          // No authorization code
          // ---------------------------------------------------------
          if (!code) {
            res.writeHead(400, {
              'Content-Type': 'text/plain',
            })

            res.end('Missing OAuth authorization code.')

            return
          }

          // ---------------------------------------------------------
          // OAuth succeeded
          // ---------------------------------------------------------
          oauthCompleted = true

          res.writeHead(200, {
            'Content-Type': 'text/html; charset=utf-8',
          })

          res.end(`
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport"
                content="width=device-width,initial-scale=1">
              <title>DBB Mail</title>
            </head>

            <body style="
              margin:0;
              height:100vh;
              display:flex;
              align-items:center;
              justify-content:center;
              padding:20px;
              font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif;
              background:#0a0a0a;
              color:#fafafa;
            ">
              <div style="
                width:100%;
                max-width:420px;
                padding:32px;
                text-align:center;
                background:#171717;
                border:1px solid #262626;
                border-radius:14px;
              ">
                <div style="
                  width:44px;
                  height:44px;
                  margin:0 auto 16px;
                  display:flex;
                  align-items:center;
                  justify-content:center;
                  border:1px solid #404040;
                  border-radius:50%;
                  color:#fafafa;
                  font-size:19px;
                  font-weight:600;
                  background:#1c1c1c;
                ">
                  ✓
                </div>

                <h1 style="
                  margin:0 0 8px;
                  font-size:20px;
                  font-weight:600;
                ">
                  Authentication Successful
                </h1>

                <p style="
                  margin:0;
                  color:#a3a3a3;
                  font-size:14px;
                  line-height:1.5;
                ">
                  Your Gmail account has been successfully
                  connected to DBB Mail with read-only access.
                </p>
              </div>
            </body>
            </html>
          `)

          // Stop accepting another OAuth request.
          closeServerSafely()

          // Close the Google OAuth window automatically.
          closeOAuthWindowSafely()

          // ---------------------------------------------------------
          // Exchange authorization code for tokens
          // ---------------------------------------------------------
          const tokenParams = new URLSearchParams()

          tokenParams.append('code', code)
          tokenParams.append('client_id', clientId)
          tokenParams.append('client_secret', clientSecret)
          tokenParams.append(
            'redirect_uri',
            assignedRedirectUri
          )
          tokenParams.append(
            'grant_type',
            'authorization_code'
          )

          const tokenRes = await axios.post<{
            access_token: string
            refresh_token?: string
            expires_in?: number
            token_type?: string
          }>(
            'https://oauth2.googleapis.com/token',
            tokenParams.toString(),
            {
              headers: {
                'Content-Type':
                  'application/x-www-form-urlencoded',
              },
              timeout: 10000,
            }
          )

          const accessToken =
            tokenRes.data.access_token

          const refreshToken =
            tokenRes.data.refresh_token

          const expiresIn =
            tokenRes.data.expires_in

          // ---------------------------------------------------------
          // Get Google account information
          // ---------------------------------------------------------
          let email = ''
          let displayName = ''
          let avatarUrl: string | undefined

          try {
            const userInfoRes = await axios.get(
              'https://www.googleapis.com/oauth2/v3/userinfo',
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
                timeout: 6000,
              }
            )

            email =
              userInfoRes.data?.email || ''

            displayName =
              userInfoRes.data?.name ||
              userInfoRes.data?.given_name ||
              ''

            avatarUrl =
              userInfoRes.data?.picture
          } catch (userInfoErr: any) {
            console.warn(
              '[GmailOAuth] UserInfo fetch warning:',
              userInfoErr?.message
            )
          }

          // ---------------------------------------------------------
          // Get Gmail profile
          // ---------------------------------------------------------
          let messagesTotal: number | undefined
          let threadsTotal: number | undefined
          let historyId: string | undefined

          try {
            const profileRes = await axios.get(
              'https://gmail.googleapis.com/gmail/v1/users/me/profile',
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
                timeout: 6000,
              }
            )

            if (profileRes.data) {
              if (!email) {
                email =
                  profileRes.data.emailAddress
              }

              messagesTotal =
                profileRes.data.messagesTotal

              threadsTotal =
                profileRes.data.threadsTotal

              historyId =
                profileRes.data.historyId
            }
          } catch (profileErr: any) {
            console.warn(
              '[GmailOAuth] Profile metadata fetch warning:',
              profileErr?.message
            )
          }

          const fallbackEmail =
            email ||
            `gmail_${Date.now()}@gmail.com`

          const fallbackName =
            displayName ||
            fallbackEmail.split('@')[0]

          resolve({
            email: fallbackEmail,
            name: fallbackName,
            accessToken,
            refreshToken,
            expiresIn,
            avatarUrl,
            messagesTotal,
            threadsTotal,
            historyId,
          })
        } catch (err: any) {
          oauthCompleted = true

          closeServerSafely()
          closeOAuthWindowSafely()

          console.error(
            '[GmailOAuth] OAuth exchange error:',
            err?.response?.data || err?.message
          )

          reject(
            new Error(
              err?.response?.data?.error_description ||
                err?.message ||
                'Failed to exchange authorization code for Gmail access token.'
            )
          )
        }
      })

      // -------------------------------------------------------------
      // Start local OAuth callback server
      // -------------------------------------------------------------
      server.listen(
        0,
        '127.0.0.1',
        () => {
          const address = server.address()

          const port =
            typeof address === 'object' &&
            address
              ? address.port
              : 0

          assignedRedirectUri =
            `http://127.0.0.1:${port}`

          const authUrl =
            `https://accounts.google.com/o/oauth2/v2/auth` +
            `?client_id=${encodeURIComponent(clientId)}` +
            `&redirect_uri=${encodeURIComponent(assignedRedirectUri)}` +
            `&response_type=code` +
            `&scope=${encodeURIComponent(GMAIL_DESKTOP_SCOPES)}` +
            `&prompt=select_account` +
            `&access_type=offline`

          console.log(
            '[GmailOAuth] Starting desktop flow on port:',
            port
          )

          // ---------------------------------------------------------
          // Create Google OAuth browser window
          // ---------------------------------------------------------
          oauthWindow = new BrowserWindow({
            width: 500,
            height: 700,
            resizable: false,
            title: 'Sign in with Google',
            webPreferences: {
              nodeIntegration: false,
              contextIsolation: true,
            },
          })

          oauthWindow.loadURL(authUrl)

          // ---------------------------------------------------------
          // AUTOMATIC CANCELLATION DETECTION
          // ---------------------------------------------------------
          oauthWindow.on('closed', () => {
            oauthWindow = null

            // If OAuth wasn't completed, closing the window
            // means the user cancelled the sign-in.
            if (!oauthCompleted && !serverClosed) {
              console.log(
                '[GmailOAuth] OAuth window closed by user.'
              )

              closeServerSafely()

              reject(
                new Error(
                  'Google sign-in was cancelled.'
                )
              )
            }
          })

          // ---------------------------------------------------------
          // Timeout
          // ---------------------------------------------------------
          timeoutId = setTimeout(() => {
            if (oauthCompleted) return

            console.log(
              '[GmailOAuth] OAuth flow timed out.'
            )

            oauthCompleted = true

            closeServerSafely()
            closeOAuthWindowSafely()

            reject(
              new Error(
                'Gmail sign-in timed out. Please try again.'
              )
            )
          }, 3 * 60 * 1000)
        }
      )

      // -------------------------------------------------------------
      // Local server error
      // -------------------------------------------------------------
      server.on('error', (err) => {
        oauthCompleted = true

        closeServerSafely()
        closeOAuthWindowSafely()

        reject(
          new Error(
            `Failed to start OAuth loopback server: ${err.message}`
          )
        )
      })
    })
  }
)

ipcMain.handle(
  'gmail:refresh-token',
  async (_event, refreshToken: string, clientId?: string, clientSecret?: string) => {
    if (!refreshToken) throw new Error('No refresh token provided.')
    const cId = clientId?.trim() || DEFAULT_DESKTOP_CLIENT_ID
    const cSec = clientSecret?.trim() || DEFAULT_DESKTOP_CLIENT_SECRET

    const tokenParams = new URLSearchParams()
    tokenParams.append('client_id', cId)
    tokenParams.append('client_secret', cSec)
    tokenParams.append('refresh_token', refreshToken)
    tokenParams.append('grant_type', 'refresh_token')

    const tokenRes = await axios.post<{
      access_token: string
      expires_in?: number
      token_type?: string
    }>('https://oauth2.googleapis.com/token', tokenParams.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 10000,
    })

    return {
      accessToken: tokenRes.data.access_token,
      expiresIn: tokenRes.data.expires_in,
    }
  }
)

function createWindow() {
  createSplash()
  
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'icon1.ico'),
    width: 1200,
    height: 700,
    minWidth: 1200,
    minHeight: 700,

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
  // On macOS, recreate the window if there are no windows.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// -------------------------------------------------------------
// Prevent multiple Electron instances
// -------------------------------------------------------------
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  // Another DBB Mail instance is already running.
  app.quit()
} else {
  // A second launch will come here instead of creating
  // another DBB Mail window.
  app.on('second-instance', () => {
    if (!win || win.isDestroyed()) {
      return
    }

    if (win.isMinimized()) {
      win.restore()
    }

    if (!win.isVisible()) {
      win.show()
    }

    win.focus()
  })

  // Start DBB Mail only once.
  app.whenReady().then(() => {
    createWindow()
  })
}
