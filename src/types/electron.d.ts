export {}

import type { MailFolder } from './mail'
import type { GmailAccount, GmailProfileResponse } from './gmail'

export interface UpdateStatusData {
  status: 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error' | 'dev'
  info?: any
  progress?: {
    bytesPerSecond: number
    percent: number
    total: number
    transferred: number
  }
  error?: string
  message?: string
}

declare global {
  interface Window {
    ipcRenderer?: any
    electronAPI?: {
      getVersion: () => Promise<string>
      checkForUpdates: () => Promise<any>
      downloadUpdate: () => Promise<any>
      quitAndInstall: () => void
      onUpdateStatus: (callback: (data: UpdateStatusData) => void) => () => void
    }
    hostinger?: {
      getMe: () => Promise<any>
      getMailboxMessages: (
        mailboxResourceId: string,
        folder: MailFolder,
        hostingerAccount: 'DMBB' | 'DBB',
        page?: number,
        perPage?: number
      ) => Promise<any>
      getMessageContent: (
        mailboxResourceId: string,
        folder: string,
        uid: number,
        hostingerAccount: 'DMBB' | 'DBB'
      ) => Promise<any>
      getMailboxQuota: (
        mailboxResourceId: string,
        hostingerAccount: 'DMBB' | 'DBB'
      ) => Promise<any>
      getMessageAttachment: (
        mailboxResourceId: string,
        folder: string,
        uid: number,
        attachmentId: string,
        hostingerAccount: 'DMBB' | 'DBB'
      ) => Promise<any>
    }
    gmail?: {
      getAccounts: () => GmailAccount[]
      getAccount: (id: string) => GmailAccount | undefined
      addAccount: (account: Omit<GmailAccount, 'id' | 'connectedAt'>) => GmailAccount
      removeAccount: (id: string) => void
      getProfile: (accessToken: string) => Promise<GmailProfileResponse>
      getMessages: (
        accountId: string,
        folder: MailFolder,
        page?: number,
        perPage?: number,
        forceRefresh?: boolean
      ) => Promise<any>
      getMessageContent: (
        accountId: string,
        messageId: string,
        forceRefresh?: boolean
      ) => Promise<any>
      getAttachmentBlob: (
        accountId: string,
        messageId: string,
        attachmentId: string,
        contentType?: string
      ) => Promise<Blob>
    }
  }
}
