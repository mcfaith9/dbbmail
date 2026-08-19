export interface GmailAccount {
  id: string
  email: string
  name: string
  avatarUrl?: string
  accessToken: string
  refreshToken?: string
  expiresAt?: number
  connectedAt: string
  historyId?: string
  messagesTotal?: number
  threadsTotal?: number
}

export interface GmailHeader {
  name: string
  value: string
}

export interface GmailPartBody {
  attachmentId?: string
  size?: number
  data?: string
}

export interface GmailPart {
  partId?: string
  mimeType?: string
  filename?: string
  headers?: GmailHeader[]
  body?: GmailPartBody
  parts?: GmailPart[]
}

export interface GmailRawMessage {
  id: string
  threadId: string
  labelIds?: string[]
  snippet?: string
  historyId?: string
  internalDate?: string
  payload?: GmailPart
  sizeEstimate?: number
  raw?: string
}

export interface GmailListMessagesResponse {
  messages?: Array<{ id: string; threadId: string }>
  nextPageToken?: string
  resultSizeEstimate?: number
}

export interface GmailProfileResponse {
  emailAddress: string
  messagesTotal: number
  threadsTotal: number
  historyId: string
}

export interface GmailAttachmentResponse {
  size: number
  attachmentId: string
  data: string
}
