export {}

import type { MailFolder } from './mail'

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
  }
}