import axios from 'axios'
import type { GmailAccount, GmailRawMessage, GmailPart, GmailProfileResponse, GmailAttachmentResponse } from '@/types/gmail'
import type { Message, Attachment, PaginationInfo, MailFolder } from '@/types/mail'
import { cacheService } from '@/services/cacheService'

const GMAIL_ACCOUNTS_STORAGE_KEY = 'dbb_gmail_accounts'
const GMAIL_API_BASE = 'https://gmail.googleapis.com/gmail/v1/users/me'

class GmailService {
  /**
   * Get all registered Gmail accounts from localStorage.
   * Strictly returns user-authenticated accounts with zero demo/mock accounts.
   */
  public getAccounts(): GmailAccount[] {
    if (typeof window === 'undefined') return []
    try {
      const raw = localStorage.getItem(GMAIL_ACCOUNTS_STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as GmailAccount[]
        if (Array.isArray(parsed)) {
          // Filter out any lingering mock/sample test accounts from older sessions
          const realAccounts = parsed.filter(
            (acc) =>
              acc &&
              acc.accessToken &&
              !acc.accessToken.startsWith('test_token') &&
              !acc.email.includes('procurement.dbb')
          )
          if (realAccounts.length !== parsed.length) {
            this.saveAccounts(realAccounts)
          }
          return realAccounts
        }
      }
      return []
    } catch (err) {
      console.warn('[GmailService] Failed to read accounts from storage:', err)
      return []
    }
  }

  /**
   * Save accounts list to localStorage
   */
  public saveAccounts(accounts: GmailAccount[]): void {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(GMAIL_ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts))
    } catch (err) {
      console.warn('[GmailService] Failed to save accounts to storage:', err)
    }
  }

  /**
   * Retrieve a specific account by ID
   */
  public getAccount(id: string): GmailAccount | undefined {
    const accounts = this.getAccounts()
    return accounts.find((acc) => acc.id === id)
  }

  /**
   * Add or update a Gmail account
   */
  public addAccount(accountData: Omit<GmailAccount, 'id' | 'connectedAt'>): GmailAccount {
    const accounts = this.getAccounts()
    const existingIndex = accounts.findIndex((a) => a.email.toLowerCase() === accountData.email.toLowerCase())

    const newAccount: GmailAccount = {
      ...accountData,
      id: existingIndex >= 0 ? accounts[existingIndex].id : `gmail_acc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      connectedAt: existingIndex >= 0 ? accounts[existingIndex].connectedAt : new Date().toISOString(),
    }

    if (existingIndex >= 0) {
      accounts[existingIndex] = newAccount
    } else {
      accounts.push(newAccount)
    }

    this.saveAccounts(accounts)
    // Clear any previous cached messages for this account to guarantee fresh live data
    cacheService.clearByPrefix(`gmail_msgs_${newAccount.id}`)
    cacheService.clearByPrefix(`gmail_content_${newAccount.id}`)
    return newAccount
  }

  /**
   * Remove a connected Gmail account & clear its cache
   */
  public removeAccount(id: string): void {
    const accounts = this.getAccounts().filter((a) => a.id !== id)
    this.saveAccounts(accounts)
    cacheService.clearByPrefix(`gmail_msgs_${id}`)
    cacheService.clearByPrefix(`gmail_content_${id}`)
  }

  /**
   * Fetch Gmail profile data for an access token
   */
  public async getProfile(accessToken: string): Promise<GmailProfileResponse> {
    const response = await axios.get<GmailProfileResponse>(`${GMAIL_API_BASE}/profile`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
      timeout: 6000,
    })
    return response.data
  }

  /**
   * Map DBB MailFolder to standard Gmail label IDs
   */
  private getGmailLabelId(folder: MailFolder): string {
    switch (folder) {
      case 'INBOX.Sent':
        return 'SENT'
      case 'INBOX.Junk':
        return 'SPAM'
      case 'INBOX':
      default:
        return 'INBOX'
    }
  }

  /**
   * Get real messages for a Gmail account from Gmail REST API with pagination.
   * Strictly live API data with zero mock/demo fallbacks.
   */
  public async getMessages(
    accountId: string,
    folder: MailFolder,
    page = 1,
    perPage = 10,
    forceRefresh = false
  ): Promise<{ data: Message[]; pagination: PaginationInfo }> {
    const cacheKey = `gmail_msgs_${accountId}_${folder}_${page}_${perPage}`

    return cacheService.fetchWithCache(
      cacheKey,
      async () => {
        const account = this.getAccount(accountId)
        if (!account) {
          throw new Error(`Gmail account "${accountId}" not found. Please connect your Gmail account.`)
        }

        if (!account.accessToken) {
          throw new Error(`No access token available for "${account.email}". Please re-authenticate.`)
        }

        const gmailLabelId = this.getGmailLabelId(folder)

        console.log('[GmailDebug] Fetching Gmail messages')
        console.log('[GmailDebug] Account:', account.email)
        console.log('[GmailDebug] Account ID:', account.id)
        console.log('[GmailDebug] Provider: gmail')
        console.log('[GmailDebug] Folder:', folder, `(Label: ${gmailLabelId})`)
        console.log('[GmailDebug] Token exists:', !!account.accessToken)
        console.log('[GmailDebug] API request started')

        try {
          const listRes = await axios.get<{
            messages?: Array<{ id: string; threadId: string }>
            nextPageToken?: string
            resultSizeEstimate?: number
          }>(`${GMAIL_API_BASE}/messages`, {
            headers: {
              Authorization: `Bearer ${account.accessToken}`,
              Accept: 'application/json',
            },
            params: {
              labelIds: [gmailLabelId],
              maxResults: perPage,
            },
            timeout: 10000,
          })

          const msgSummaries = listRes.data?.messages || []
          const estimatedTotal = listRes.data?.resultSizeEstimate ?? msgSummaries.length

          console.log('[GmailDebug] HTTP status:', listRes.status)
          console.log('[GmailDebug] Message count:', msgSummaries.length)
          console.log('[GmailDebug] Result size estimate:', estimatedTotal)

          if (msgSummaries.length === 0) {
            return {
              data: [],
              pagination: {
                page,
                perPage,
                total: 0,
                totalPages: 1,
              },
            }
          }

          // Fetch full message details for each message in the page
          const detailedMessages = await Promise.all(
            msgSummaries.map(async (item) => {
              try {
                const detailRes = await axios.get<GmailRawMessage>(`${GMAIL_API_BASE}/messages/${item.id}`, {
                  headers: {
                    Authorization: `Bearer ${account.accessToken}`,
                    Accept: 'application/json',
                  },
                  params: { format: 'full' },
                  timeout: 8000,
                })
                return this.transformRawMessage(detailRes.data, accountId, folder)
              } catch (detailErr) {
                console.warn(`[GmailDebug] Failed to fetch message details for ID ${item.id}:`, detailErr)
                return {
                  id: item.id,
                  uid: item.id,
                  subject: '(Message details unavailable)',
                  snippet: '',
                  provider: 'gmail' as const,
                  gmailAccountId: accountId,
                  gmailMessageId: item.id,
                  path: folder,
                  date: new Date().toISOString(),
                } as Message
              }
            })
          )

          return {
            data: detailedMessages,
            pagination: {
              page,
              perPage,
              total: Math.max(estimatedTotal, detailedMessages.length),
              totalPages: Math.max(1, Math.ceil(Math.max(estimatedTotal, detailedMessages.length) / perPage)),
            },
          }
        } catch (err: any) {
          console.error('[GmailDebug] Live Gmail API call failed:', err?.response?.data || err?.message)
          if (err?.response?.status === 401) {
            throw new Error(`Gmail access token has expired for ${account.email}. Please click "Add Gmail Account" to re-authenticate.`)
          } else if (err?.response?.status === 403) {
            throw new Error(`Permission error accessing Gmail (${account.email}). Ensure "https://www.googleapis.com/auth/gmail.readonly" is authorized.`)
          }
          throw new Error(err?.response?.data?.error?.message || err?.message || 'Failed to fetch messages from Gmail API.')
        }
      },
      3 * 60 * 1000, // 3 minutes cache TTL
      forceRefresh
    )
  }

  /**
   * Fetch full message content (text and html body + attachments) for a Gmail message
   */
  public async getMessageContent(
    accountId: string,
    messageId: string,
    forceRefresh = false
  ): Promise<{ text?: string; html?: string; attachments?: Attachment[] }> {
    const cacheKey = `gmail_content_${accountId}_${messageId}`

    return cacheService.fetchWithCache(
      cacheKey,
      async () => {
        const account = this.getAccount(accountId)
        if (!account || !account.accessToken) {
          throw new Error('Gmail account not found or access token missing.')
        }

        try {
          const res = await axios.get<GmailRawMessage>(`${GMAIL_API_BASE}/messages/${messageId}`, {
            headers: {
              Authorization: `Bearer ${account.accessToken}`,
              Accept: 'application/json',
            },
            params: { format: 'full' },
            timeout: 8000,
          })

          const payload = res.data?.payload
          const { text, html, attachments } = this.extractBodyAndAttachments(payload, messageId)
          return { text, html, attachments }
        } catch (err: any) {
          console.error(`[GmailDebug] Failed to fetch message body for ${messageId}:`, err?.message)
          throw new Error(err?.response?.data?.error?.message || err?.message || 'Failed to retrieve message content.')
        }
      },
      10 * 60 * 1000,
      forceRefresh
    )
  }

  /**
   * Fetch and decode an attachment into a downloadable Blob
   */
  public async getAttachmentBlob(
    accountId: string,
    messageId: string,
    attachmentId: string,
    contentType = 'application/octet-stream'
  ): Promise<Blob> {
    const account = this.getAccount(accountId)
    if (!account || !account.accessToken) {
      throw new Error('Gmail account not found or access token missing.')
    }

    try {
      const res = await axios.get<GmailAttachmentResponse>(
        `${GMAIL_API_BASE}/messages/${messageId}/attachments/${attachmentId}`,
        {
          headers: {
            Authorization: `Bearer ${account.accessToken}`,
            Accept: 'application/json',
          },
          timeout: 10000,
        }
      )

      if (res.data?.data) {
        const rawBase64 = res.data.data.replace(/-/g, '+').replace(/_/g, '/')
        const binaryStr = atob(rawBase64)
        const len = binaryStr.length
        const bytes = new Uint8Array(len)
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryStr.charCodeAt(i)
        }
        return new Blob([bytes], { type: contentType })
      }
      throw new Error('Attachment payload is empty.')
    } catch (err: any) {
      console.error(`[GmailDebug] Attachment fetch failed for ${attachmentId}:`, err?.message)
      throw new Error(err?.response?.data?.error?.message || err?.message || 'Failed to download attachment.')
    }
  }

  /**
   * Convert Gmail raw message payload into standard Message
   */
  private transformRawMessage(raw: GmailRawMessage, accountId: string, folder: MailFolder): Message {
    const headers = raw.payload?.headers || []
    const getHeader = (name: string) => headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || ''

    const fromHeader = getHeader('From')
    const subject = getHeader('Subject') || '(No Subject)'
    const date = getHeader('Date') || (raw.internalDate ? new Date(Number(raw.internalDate)).toISOString() : new Date().toISOString())
    const unread = raw.labelIds?.includes('UNREAD') ?? false

    // Parse sender name & address
    let senderName = fromHeader
    let senderAddress = fromHeader
    const match = fromHeader.match(/^(.*?)\s*<(.+?)>$/)
    if (match) {
      senderName = match[1].replace(/^["']|["']$/g, '').trim() || match[2]
      senderAddress = match[2].trim()
    }

    const { text, html, attachments } = this.extractBodyAndAttachments(raw.payload, raw.id)

    return {
      id: raw.id,
      uid: raw.id,
      path: folder,
      subject,
      from: { name: senderName, address: senderAddress },
      to: [{ address: getHeader('To') }],
      date,
      unseen: unread,
      unread,
      snippet: raw.snippet || '',
      size: raw.sizeEstimate || 1024,
      provider: 'gmail',
      gmailAccountId: accountId,
      gmailMessageId: raw.id,
      text,
      html,
      attachments,
    }
  }

  /**
   * Recursively extract text/plain, text/html, and attachments from MIME parts
   */
  private extractBodyAndAttachments(
    part?: GmailPart,
    messageId?: string
  ): { text?: string; html?: string; attachments: Attachment[] } {
    let text = ''
    let html = ''
    const attachments: Attachment[] = []

    if (!part) return { text, html, attachments }

    const decodeBase64Url = (str?: string) => {
      if (!str) return ''
      try {
        const clean = str.replace(/-/g, '+').replace(/_/g, '/')
        return decodeURIComponent(
          escape(atob(clean))
        )
      } catch {
        try {
          return atob(str.replace(/-/g, '+').replace(/_/g, '/'))
        } catch {
          return ''
        }
      }
    }

    const traverse = (p: GmailPart) => {
      // Check for attachment
      if (p.filename && p.body?.attachmentId) {
        attachments.push({
          id: p.body.attachmentId,
          filename: p.filename,
          contentType: p.mimeType || 'application/octet-stream',
          sizeBytes: p.body.size || 0,
          gmailAttachmentId: p.body.attachmentId,
          messageId,
        })
      }

      // Check text or html body
      if (p.mimeType === 'text/plain' && p.body?.data && !text) {
        text = decodeBase64Url(p.body.data)
      } else if (p.mimeType === 'text/html' && p.body?.data && !html) {
        html = decodeBase64Url(p.body.data)
      }

      if (p.parts && p.parts.length > 0) {
        for (const childPart of p.parts) {
          traverse(childPart)
        }
      }
    }

    traverse(part)

    return { text, html, attachments }
  }
}

export const gmailService = new GmailService()
