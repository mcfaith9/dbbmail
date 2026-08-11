export {}

declare global {
  interface Window {
    ipcRenderer?: any
    electronAPI?: {
      getVersion: () => Promise<string>
    }
    hostinger?: {
      getMe: () => Promise<any>
      getMailboxMessages: (
        mailboxResourceId: string,
        folder: string,
        hostingerAccount: 'DMBB' | 'DBB'
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