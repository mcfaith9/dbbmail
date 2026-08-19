import axios from 'axios'
import { gmailService } from '@/services/gmailService'
import type { GmailAccount } from '@/types/gmail'

export const GMAIL_READONLY_SCOPE = 'https://www.googleapis.com/auth/gmail.readonly'

// Default Google OAuth Desktop Client ID
export const DEFAULT_GOOGLE_CLIENT_ID = '57949158433-qo7d4ru9buhpnmhkmj1k35m5jpm9errl.apps.googleusercontent.com'

export interface GmailSignInResult {
  account: GmailAccount
  accessToken: string
}

declare global {
  interface Window {
    electronAPI?: {
      getVersion: () => Promise<string>
      checkForUpdates: () => Promise<any>
      downloadUpdate: () => Promise<any>
      quitAndInstall: () => void
      signInWithGmail?: (options?: { clientId?: string; clientSecret?: string }) => Promise<{
        email: string
        name: string
        accessToken: string
        refreshToken?: string
        avatarUrl?: string
        messagesTotal?: number
        threadsTotal?: number
        historyId?: string
      }>
      onUpdateStatus: (callback: (data: any) => void) => () => void
    }
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string
            scope: string
            prompt?: string
            callback: (response: {
              access_token?: string
              error?: string
              error_description?: string
              expires_in?: number
            }) => void
            error_callback?: (error: any) => void
          }) => {
            requestAccessToken: (overrideConfig?: { prompt?: string }) => void
          }
        }
      }
    }
  }
}

/**
 * Dynamically load Google Identity Services script if not already present
 */
function loadGoogleGsiScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return reject(new Error('Window context not available'))
    }

    if (window.google?.accounts?.oauth2) {
      return resolve()
    }

    const existingScript = document.getElementById('google-gsi-client')
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve())
      existingScript.addEventListener('error', (e) => reject(e))
      return
    }

    const script = document.createElement('script')
    script.id = 'google-gsi-client'
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Google Identity Services library.'))
    document.head.appendChild(script)
  })
}

/**
 * Google OAuth 2.0 Sign In
 * Uses Electron Desktop Loopback flow when running in Electron desktop app,
 * and falls back to Google Identity Services Token Client when in pure web browser.
 */
export async function signInWithGmailOAuth(
  customClientId?: string,
  customClientSecret?: string
): Promise<GmailSignInResult> {
  const clientId = customClientId?.trim() || DEFAULT_GOOGLE_CLIENT_ID

  if (typeof window !== 'undefined') {
    console.log('[GmailAuth] Initiating Google OAuth:')
    console.log('[GmailAuth] window.location.href:', window.location.href)
    console.log('[GmailAuth] window.location.origin:', window.location.origin)
    console.log('[GmailAuth] Client ID:', clientId)
  }

  // -------------------------------------------------------------
  // 1. Electron Desktop Environment (Packaged & Dev Electron)
  // -------------------------------------------------------------
  if (typeof window !== 'undefined' && window.electronAPI?.signInWithGmail) {
    console.log('[GmailAuth] Running in Electron environment — using Desktop loopback flow.')
    const electronResult = await window.electronAPI.signInWithGmail({
      clientId,
      clientSecret: customClientSecret?.trim(),
    })

    const account = gmailService.addAccount({
      email: electronResult.email,
      name: electronResult.name,
      accessToken: electronResult.accessToken,
      refreshToken: electronResult.refreshToken,
      avatarUrl: electronResult.avatarUrl,
      messagesTotal: electronResult.messagesTotal,
      threadsTotal: electronResult.threadsTotal,
      historyId: electronResult.historyId,
    })

    return {
      account,
      accessToken: electronResult.accessToken,
    }
  }

  // -------------------------------------------------------------
  // 2. Web Browser Fallback (Google Identity Services)
  // -------------------------------------------------------------
  await loadGoogleGsiScript()

  if (!window.google?.accounts?.oauth2) {
    throw new Error('Google Identity Services SDK could not be initialized.')
  }

  return new Promise((resolve, reject) => {
    try {
      const tokenClient = window.google!.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: GMAIL_READONLY_SCOPE,
        prompt: 'select_account',
        callback: async (response) => {
          if (response.error) {
            console.error('[GmailAuth] OAuth error response:', response)
            let msg = response.error_description || response.error
            if (response.error === 'invalid_client') {
              msg = `Error 401 (invalid_client): Make sure "${window.location.origin}" is added to Authorized JavaScript origins for Client ID in Google Cloud Console.`
            } else if (response.error === 'access_denied') {
              msg = `Access Denied: Please grant read-only permissions and ensure your email is added under "Test users" in Google Cloud OAuth consent screen.`
            }
            return reject(new Error(msg))
          }

          if (!response.access_token) {
            return reject(new Error('No access token returned from Google authentication.'))
          }

          const accessToken = response.access_token

          try {
            // Fetch User Profile from Google OAuth UserInfo endpoint
            let email = ''
            let displayName = ''
            let avatarUrl: string | undefined

            try {
              const userInfoRes = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${accessToken}` },
                timeout: 6000,
              })
              email = userInfoRes.data?.email || ''
              displayName = userInfoRes.data?.name || userInfoRes.data?.given_name || ''
              avatarUrl = userInfoRes.data?.picture
            } catch (err) {
              console.warn('[GmailAuth] UserInfo endpoint warning, falling back to Gmail profile:', err)
            }

            // Fetch live Gmail Mailbox Profile stats
            let profileData = {
              messagesTotal: undefined as number | undefined,
              threadsTotal: undefined as number | undefined,
              historyId: undefined as string | undefined,
            }

            try {
              const profile = await gmailService.getProfile(accessToken)
              if (profile) {
                if (!email) email = profile.emailAddress
                profileData = {
                  messagesTotal: profile.messagesTotal,
                  threadsTotal: profile.threadsTotal,
                  historyId: profile.historyId,
                }
              }
            } catch (profileErr) {
              console.warn('[GmailAuth] Profile metadata fetch warning:', profileErr)
            }

            const fallbackEmail = email || `gmail_${Date.now()}@gmail.com`
            const fallbackName = displayName || fallbackEmail.split('@')[0]

            // Register or update the account in DBB Mail's multi-account Gmail service
            const account = gmailService.addAccount({
              email: fallbackEmail,
              name: fallbackName,
              accessToken,
              avatarUrl,
              messagesTotal: profileData.messagesTotal,
              threadsTotal: profileData.threadsTotal,
              historyId: profileData.historyId,
            })

            resolve({
              account,
              accessToken,
            })
          } catch (fetchErr: any) {
            reject(new Error(fetchErr?.message || 'Failed to fetch Gmail account details.'))
          }
        },
        error_callback: (error) => {
          console.error('[GmailAuth] OAuth error callback:', error)
          reject(new Error(error?.message || 'Google OAuth dialog encountered an error.'))
        },
      })

      // Trigger the Google OAuth Account Selection & Consent popup
      tokenClient.requestAccessToken({ prompt: 'select_account' })
    } catch (err: any) {
      reject(new Error(err?.message || 'Failed to start Google OAuth flow.'))
    }
  })
}
