export interface Attachment {
  id: string
  contentType?: string
  sizeBytes?: number
  inline?: boolean
  filename?: string
  contentId?: string
}

export interface Message {
  uid?: number | string
  id?: string
  path?: string
  subject?: string
  from?: { name?: string; address?: string } | string
  to?: Array<{ name?: string; address?: string }> | string
  date?: string
  flags?: string[]
  unseen?: boolean
  unread?: boolean
  snippet?: string
  body?: string
  attachments?: Attachment[]
  size?: number
  text?: string
  html?: string
  contentLoading?: boolean
  contentError?: string | null
  mailboxResourceId?: string
  hostingerAccount?: 'DMBB' | 'DBB'
}

export interface PaginationInfo {
  page: number
  perPage: number
  total: number
  totalPages: number
}

export interface Mailbox {
  resourceId: string
  address: string,
  hostingerAccount: 'DMBB' | 'DBB'
}

export interface MailboxQuota {
  resourceName: 'STORAGE' | 'MESSAGE' | string
  usage: number
  limit: number
  percentage: number
}

export interface MailboxQuotaResponse {
  data: {
    quotas: MailboxQuota[]
    totalUsage: number
    totalLimit: number
    totalPercentage: number
    supported: boolean
  }
}

export type MailFolder = 'INBOX' | 'INBOX.Sent' | 'INBOX.Junk'