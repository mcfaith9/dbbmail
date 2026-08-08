export interface Attachment {
  id: string
  contentType?: string
  sizeBytes?: number
  inline?: boolean
  filename?: string
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
  size?: number,
  text?: string
  html?: string
  contentLoading?: boolean
  contentError?: string | null
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
