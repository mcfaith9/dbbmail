import axios from 'axios'

if (typeof window !== 'undefined') {
  if (!window.ipcRenderer) {
    window.ipcRenderer = {
      on: () => {},
      off: () => {},
      send: () => {},
      invoke: async (channel: string) => {
        if (channel === 'app:get-version') return '1.0.0'
        return null
      },
    }
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
        hostingerAccount: 'DMBB' | 'DBB'
      ) => {
        const res = await axios.get('/api/hostinger/userinbox', {
          params: { mailboxResourceId, folder, hostingerAccount },
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
}
