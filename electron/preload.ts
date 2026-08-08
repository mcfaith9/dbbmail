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

contextBridge.exposeInMainWorld('hostinger', {
  getMe: () =>
    ipcRenderer.invoke('hostinger:me'),

  getMailboxMessages: (
    mailboxResourceId: string,
    folder: string,
    page: number = 1,
    perPage: number = 10
  ) =>
    ipcRenderer.invoke(
      'hostinger:userinbox',
      mailboxResourceId,
      folder,
      page,
      perPage
    ),

  getMessageContent: (
    mailboxResourceId: string,
    folder: string,
    uid: number
  ) =>
    ipcRenderer.invoke(
      'hostinger:usermessagecontent',
      mailboxResourceId,
      folder,
      uid
    ),
})