import { ipcRenderer, contextBridge } from 'electron'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },

  // You can expose other APTs you need here.
  // ...
})

contextBridge.exposeInMainWorld('electronAPI', {
  getVersion: () => ipcRenderer.invoke('app:get-version'),
})

contextBridge.exposeInMainWorld('hostinger', {
  getMe: () =>
    ipcRenderer.invoke('hostinger:me'),

  getMailboxMessages: (
    mailboxResourceId: string,
    folder: string,
    hostingerAccount: 'DMBB' | 'DBB'
  ) =>
    ipcRenderer.invoke(
      'hostinger:userinbox',
      mailboxResourceId,
      folder,
      hostingerAccount
    ),

  getMessageContent: (
    mailboxResourceId: string,
    folder: string,
    uid: number,
    hostingerAccount: 'DMBB' | 'DBB'
  ) =>
    ipcRenderer.invoke(
      'hostinger:usermessagecontent',
      mailboxResourceId,
      folder,
      uid,
      hostingerAccount
    ),

  getMailboxQuota: (
    mailboxResourceId: string,
    hostingerAccount: 'DMBB' | 'DBB',
  ) =>
    ipcRenderer.invoke(
      'hostinger:get-mailbox-quota',
      mailboxResourceId,
      hostingerAccount,
    ),

  getMessageAttachment: (
    mailboxResourceId: string,
    folder: string,
    uid: number,
    attachmentId: string,
    hostingerAccount: 'DMBB' | 'DBB'
  ) =>
    ipcRenderer.invoke(
      'hostinger:getmessageattachment',
      mailboxResourceId,
      folder,
      uid,
      attachmentId,
      hostingerAccount
    ),
})