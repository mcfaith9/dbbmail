import type { Message } from '@/types/mail'

export function useMailFormatting() {
  function formatDate(dateStr?: string): string {
    if (!dateStr) return ''
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateStr
    }
  }

  function formatSender(from?: { name?: string; address?: string } | string): string {
    if (!from) return 'Unknown Sender'
    if (typeof from === 'string') return from
    return from.name || from.address || 'Unknown Sender'
  }

  function formatSenderAddress(from?: { name?: string; address?: string } | string): string {
    if (!from) return ''
    if (typeof from === 'string') return from
    return from.address ? `<${from.address}>` : ''
  }

  function formatFileSize(bytes?: number): string {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  function isUnread(msg: Message): boolean {
    if (msg.unseen !== undefined) return msg.unseen
    if (msg.unread !== undefined) return msg.unread
    if (msg.flags && Array.isArray(msg.flags)) {
      return !msg.flags.includes('\\Seen')
    }
    return false
  }

  return {
    formatDate,
    formatSender,
    formatSenderAddress,
    formatFileSize,
    isUnread,
  }
}
