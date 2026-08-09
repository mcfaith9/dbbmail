"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("ipcRenderer", {
  on(...args) {
    const [channel, listener] = args;
    return electron.ipcRenderer.on(channel, (event, ...args2) => listener(event, ...args2));
  },
  off(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.off(channel, ...omit);
  },
  send(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.send(channel, ...omit);
  },
  invoke(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.invoke(channel, ...omit);
  }
  // You can expose other APTs you need here.
  // ...
});
electron.contextBridge.exposeInMainWorld("electronAPI", {
  getVersion: () => electron.ipcRenderer.invoke("app:get-version")
});
electron.contextBridge.exposeInMainWorld("hostinger", {
  getMe: () => electron.ipcRenderer.invoke("hostinger:me"),
  getMailboxMessages: (mailboxResourceId, folder, hostingerAccount) => electron.ipcRenderer.invoke(
    "hostinger:userinbox",
    mailboxResourceId,
    folder,
    hostingerAccount
  ),
  getMessageContent: (mailboxResourceId, folder, uid, hostingerAccount) => electron.ipcRenderer.invoke(
    "hostinger:usermessagecontent",
    mailboxResourceId,
    folder,
    uid,
    hostingerAccount
  ),
  getMailboxQuota: (mailboxResourceId, hostingerAccount) => electron.ipcRenderer.invoke(
    "hostinger:get-mailbox-quota",
    mailboxResourceId,
    hostingerAccount
  )
});
