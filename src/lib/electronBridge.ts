import axios from 'axios'
import { gmailService } from '@/services/gmailService'
import type { MailFolder } from '@/types/mail'
import type { GmailAccount } from '@/types/gmail'

if (typeof window !== 'undefined') {
  if (!window.ipcRenderer) {
    window.ipcRenderer = {
      on: () => window.ipcRenderer,
      off: () => window.ipcRenderer,
      send: () => {},
      invoke: async (channel: string) => {
        if (channel === 'app:get-version') return '1.0.0'
        return null
      },
    } as any
  }

  if (!window.electronAPI) {
    window.electronAPI = {
      getVersion: async () => {
        try {
          const res = await axios.get('/api/version')
          return res.data?.version || '1.0.0'
        } catch {
          return '1.0.0'
        }
      },
      checkForUpdates: async () => ({ status: 'dev', message: 'Not available in web preview' }),
      downloadUpdate: async () => {},
      quitAndInstall: () => {},
      onUpdateStatus: () => () => {},
      refreshGmailToken: async (refreshToken: string, clientId?: string, clientSecret?: string) => {
        const cId = clientId?.trim() || '57949158433-qo7d4ru9buhpnmhkmj1k35m5jpm9errl.apps.googleusercontent.com'
        const tokenParams = new URLSearchParams()
        tokenParams.append('client_id', cId)
        if (clientSecret?.trim()) {
          tokenParams.append('client_secret', clientSecret.trim())
        }
        tokenParams.append('refresh_token', refreshToken)
        tokenParams.append('grant_type', 'refresh_token')

        const res = await axios.post<{
          access_token: string
          expires_in?: number
          token_type?: string
        }>('https://oauth2.googleapis.com/token', tokenParams.toString(), {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          timeout: 10000,
        })

        return {
          accessToken: res.data.access_token,
          expiresIn: res.data.expires_in,
        }
      },
    }
  }

  if (!window.hostinger) {
    window.hostinger = {
      getMe: async () => {
        const res = await axios.get('/api/hostinger/me')
        return res.data
      },
      getMailboxMessages: async (
        mailboxResourceId: string,
        folder: string,
        hostingerAccount: 'DMBB' | 'DBB',
        page = 1,
        perPage = 10
      ) => {
        const res = await axios.get('/api/hostinger/userinbox', {
          params: {
            mailboxResourceId,
            folder,
            hostingerAccount,
            page,
            perPage,
          },
        })

        return res.data
      },
      getMessageContent: async (
        mailboxResourceId: string,
        folder: string,
        uid: number,
        hostingerAccount: 'DMBB' | 'DBB'
      ) => {
        const res = await axios.get('/api/hostinger/usermessagecontent', {
          params: { mailboxResourceId, folder, uid, hostingerAccount },
        })
        return res.data
      },
      getMailboxQuota: async (
        mailboxResourceId: string,
        hostingerAccount: 'DMBB' | 'DBB'
      ) => {
        const res = await axios.get('/api/hostinger/get-mailbox-quota', {
          params: { mailboxResourceId, hostingerAccount },
        })
        return res.data
      },
      getMessageAttachment: async (
        mailboxResourceId: string,
        folder: string,
        uid: number,
        attachmentId: string,
        hostingerAccount: 'DMBB' | 'DBB'
      ) => {
        const res = await axios.get('/api/hostinger/userattachment', {
          params: { mailboxResourceId, folder, uid, attachmentId, hostingerAccount },
          responseType: 'arraybuffer',
        })
        return res.data
      },
    }
  }

  if (!window.gmail) {
    window.gmail = {
      getAccounts: () => gmailService.getAccounts(),
      getAccount: (id: string) => gmailService.getAccount(id),
      addAccount: (account: Omit<GmailAccount, 'id' | 'connectedAt'>) => gmailService.addAccount(account),
      removeAccount: (id: string) => gmailService.removeAccount(id),
      getProfile: (accessToken: string) => gmailService.getProfile(accessToken),
      getMessages: (
        accountId: string,
        folder: MailFolder,
        page = 1,
        perPage = 10,
        forceRefresh = false
      ) => gmailService.getMessages(accountId, folder, page, perPage, forceRefresh),
      getMessageContent: (accountId: string, messageId: string, forceRefresh = false) =>
        gmailService.getMessageContent(accountId, messageId, forceRefresh),
      getAttachmentBlob: (
        accountId: string,
        messageId: string,
        attachmentId: string,
        contentType?: string
      ) => gmailService.getAttachmentBlob(accountId, messageId, attachmentId, contentType),
    }
  }
}
