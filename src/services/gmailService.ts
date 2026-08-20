import axios from 'axios'
import type {
  GmailAccount,
  GmailRawMessage,
  GmailPart,
  GmailProfileResponse,
  GmailAttachmentResponse,
} from '@/types/gmail'
import type { Message, Attachment, PaginationInfo, MailFolder } from '@/types/mail'
import { cacheService } from '@/services/cacheService'

const GMAIL_ACCOUNTS_STORAGE_KEY = 'dbb_gmail_accounts'
const GMAIL_API_BASE = 'https://gmail.googleapis.com/gmail/v1/users/me'
const DEFAULT_GOOGLE_CLIENT_ID =
  '57949158433-qo7d4ru9buhpnmhkmj1k35m5jpm9errl.apps.googleusercontent.com'

class GmailService {
  // In-flight refresh token promises map to prevent race conditions across concurrent requests
  private refreshingPromises = new Map<string, Promise<string>>()

  // Page tokens store: key = `${accountId}_${folder}_${perPage}`, value = Map<pageNumber, pageToken>
  private pageTokensCache = new Map<string, Map<number, string>>()

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
   * Update an existing account record in storage
   */
  public updateAccount(account: GmailAccount): void {
    const accounts = this.getAccounts()
    const index = accounts.findIndex((a) => a.id === account.id)
    if (index >= 0) {
      accounts[index] = account
      this.saveAccounts(accounts)
    }
  }

  /**
   * Add or update a Gmail account
   */
  public addAccount(accountData: Omit<GmailAccount, 'id' | 'connectedAt'>): GmailAccount {
    const accounts = this.getAccounts()
    const existingIndex = accounts.findIndex(
      (a) => a.email.toLowerCase() === accountData.email.toLowerCase()
    )

    const existing = existingIndex >= 0 ? accounts[existingIndex] : undefined

    const newAccount: GmailAccount = {
      ...accountData,
      id: existing ? existing.id : `gmail_acc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      connectedAt: existing ? existing.connectedAt : new Date().toISOString(),
      // Preserve existing refreshToken and other fields if not passed in this call
      refreshToken: accountData.refreshToken || existing?.refreshToken,
      expiresAt: accountData.expiresAt || existing?.expiresAt,
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
    this.clearPageTokens(newAccount.id)
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
    this.clearPageTokens(id)
  }

  /**
   * Clear pagination page tokens for an account
   */
  public clearPageTokens(accountId?: string, folder?: MailFolder, perPage?: number): void {
    if (!accountId) {
      this.pageTokensCache.clear()
      return
    }
    if (folder && perPage) {
      this.pageTokensCache.delete(`${accountId}_${folder}_${perPage}`)
      return
    }
    for (const key of Array.from(this.pageTokensCache.keys())) {
      if (key.startsWith(`${accountId}_`)) {
        this.pageTokensCache.delete(key)
      }
    }
  }

  /**
   * Check if the account access token is expired or expiring soon (within 60-second safety window).
   */
  public isTokenExpiredOrExpiring(account: GmailAccount): boolean {
    if (!account.expiresAt) {
      return false
    }
    const SAFETY_BUFFER_MS = 60 * 1000 // 60-second safety window
    return account.expiresAt <= Date.now() + SAFETY_BUFFER_MS
  }

  /**
   * Refresh the access token using the stored refresh token.
   * Handles Electron desktop IPC loopback or direct token endpoint.
   */
  public async refreshAccessToken(account: GmailAccount): Promise<string> {
    console.log(`[GmailAuth] Attempting token refresh for account ${account.email}...`)

    if (!account.refreshToken) {
      throw new Error(
        `No refresh token available for ${account.email}. The account authorization has expired; please re-authenticate.`
      )
    }

    try {
      let newAccessToken = ''
      let expiresIn: number | undefined

      if (typeof window !== 'undefined' && window.electronAPI?.refreshGmailToken) {
        console.log('[GmailAuth] Using Electron IPC refreshGmailToken channel...')
        const res = await window.electronAPI.refreshGmailToken(account.refreshToken)
        newAccessToken = res.accessToken
        expiresIn = res.expiresIn
      } else {
        console.log('[GmailAuth] Using direct Google OAuth refresh endpoint...')
        const tokenParams = new URLSearchParams()
        tokenParams.append('client_id', DEFAULT_GOOGLE_CLIENT_ID)
        tokenParams.append('refresh_token', account.refreshToken)
        tokenParams.append('grant_type', 'refresh_token')

        const res = await axios.post<{
          access_token: string
          expires_in?: number
          token_type?: string
        }>('https://oauth2.googleapis.com/token', tokenParams.toString(), {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          timeout: 10000,
        })

        newAccessToken = res.data.access_token
        expiresIn = res.data.expires_in
      }

      if (!newAccessToken) {
        throw new Error('Google OAuth server did not return a valid access token.')
      }

      // Update account in-memory & in localStorage
      const updatedAccount: GmailAccount = {
        ...account,
        accessToken: newAccessToken,
        expiresAt: expiresIn ? Date.now() + expiresIn * 1000 : Date.now() + 3500 * 1000,
      }

      this.updateAccount(updatedAccount)
      console.log(`[GmailAuth] Access token expired and was automatically refreshed for ${account.email}.`)
      return newAccessToken
    } catch (err: any) {
      console.error(`[GmailAuth] Failed to refresh token for ${account.email}:`, err?.response?.data || err?.message)
      const errData = err?.response?.data
      if (errData?.error === 'invalid_grant') {
        throw new Error(
          `Gmail refresh token is invalid or has been revoked for ${account.email}. Please reconnect your Gmail account.`
        )
      }
      throw new Error(
        `Failed to refresh Gmail access token for ${account.email}: ${errData?.error_description || err?.message || 'Authorization error'}. Please reconnect if this persists.`
      )
    }
  }

  /**
   * Acquire a valid token for the account, deduplicating concurrent refresh requests.
   */
  public async getValidAccessToken(account: GmailAccount): Promise<string> {
    if (this.isTokenExpiredOrExpiring(account) && account.refreshToken) {
      console.log(`[GmailAuth] Token expiring soon for ${account.email}. Proactively refreshing before request.`)
      return this.ensureRefreshedToken(account)
    }
    return account.accessToken
  }

  /**
   * Ensure a single ongoing refresh operation per account (prevents duplicate simultaneous refresh requests)
   */
  public async ensureRefreshedToken(account: GmailAccount): Promise<string> {
    const accountId = account.id
    if (this.refreshingPromises.has(accountId)) {
      return this.refreshingPromises.get(accountId)!
    }

    const promise = this.refreshAccessToken(account).finally(() => {
      this.refreshingPromises.delete(accountId)
    })

    this.refreshingPromises.set(accountId, promise)
    return promise
  }

  /**
   * Helper to execute a Gmail API request with automatic token expiration check,
   * 401 interception, single token refresh attempt, and single retry.
   */
  private async executeWithAuthRetry<T>(
    accountId: string,
    requestFn: (token: string) => Promise<T>
  ): Promise<T> {
    let account = this.getAccount(accountId)
    if (!account) {
      throw new Error(`Gmail account "${accountId}" not found. Please connect your Gmail account.`)
    }

    if (!account.accessToken) {
      throw new Error(`No access token available for "${account.email}". Please re-authenticate.`)
    }

    // 1. Proactively refresh if already expired or about to expire within 60 seconds
    const token = await this.getValidAccessToken(account)

    try {
      return await requestFn(token)
    } catch (err: any) {
      // 2. If a 401 Unauthorized is returned, attempt refresh and retry once
      if (err?.response?.status === 401) {
        console.warn(
          `[GmailAuth] Received 401 Unauthorized for ${account.email}. Attempting automatic token refresh and retry...`
        )

        if (!account.refreshToken) {
          throw new Error(
            `Gmail access token has expired for ${account.email} and no refresh token is stored. Please re-authenticate.`
          )
        }

        try {
          const refreshedToken = await this.ensureRefreshedToken(account)
          console.log(`[GmailAuth] Token refreshed successfully for ${account.email}. Retrying original request...`)
          return await requestFn(refreshedToken)
        } catch (refreshErr: any) {
          console.error(`[GmailAuth] Automatic token refresh failed for ${account.email}:`, refreshErr.message)
          throw new Error(
            refreshErr.message || `Authentication failed for ${account.email}. Please reconnect your account.`
          )
        }
      }

      // Non-401 error: rethrow
      throw err
    }
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
  private getGmailLabelId(folder: MailFolder | string): string {
    const normalized = (folder || 'INBOX').toUpperCase()
    if (normalized === 'INBOX.SENT' || normalized === 'SENT') {
      return 'SENT'
    }
    if (
      normalized === 'INBOX.JUNK' ||
      normalized === 'JUNK' ||
      normalized === 'SPAM' ||
      normalized === 'INBOX.SPAM'
    ) {
      return 'SPAM'
    }
    if (normalized === 'INBOX.TRASH' || normalized === 'TRASH') {
      return 'TRASH'
    }
    if (normalized === 'INBOX.DRAFTS' || normalized === 'DRAFTS') {
      return 'DRAFT'
    }
    return 'INBOX'
  }

  /**
   * Look up or sequentially resolve the Gmail pageToken for a given page number.
   */
  private async getPageTokenForPage(
    accountId: string,
    folder: MailFolder,
    targetPage: number,
    perPage: number,
    accessToken: string,
    gmailLabelId: string
  ): Promise<string | undefined> {
    if (targetPage <= 1) return undefined

    const cacheKey = `${accountId}_${folder}_${perPage}`
    if (!this.pageTokensCache.has(cacheKey)) {
      this.pageTokensCache.set(cacheKey, new Map<number, string>([[1, '']]))
    }
    const tokenMap = this.pageTokensCache.get(cacheKey)!

    if (tokenMap.has(targetPage)) {
      return tokenMap.get(targetPage) || undefined
    }

    // Find the highest known page number < targetPage
    let highestKnownPage = 1
    for (let p = targetPage - 1; p >= 1; p--) {
      if (tokenMap.has(p)) {
        highestKnownPage = p
        break
      }
    }

    // Walk forward sequentially from highestKnownPage to targetPage
    let currentToken = tokenMap.get(highestKnownPage) || undefined
    for (let p = highestKnownPage; p < targetPage; p++) {
      const params: Record<string, any> = {
        labelIds: [gmailLabelId],
        maxResults: perPage,
      }
      if (currentToken) {
        params.pageToken = currentToken
      }

      const listRes = await axios.get<{
        nextPageToken?: string
      }>(`${GMAIL_API_BASE}/messages`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
        params,
        paramsSerializer: (p) => {
          const searchParams = new URLSearchParams()
          for (const [key, value] of Object.entries(p)) {
            if (Array.isArray(value)) {
              value.forEach((v) => searchParams.append(key, v))
            } else if (value !== undefined && value !== null) {
              searchParams.append(key, String(value))
            }
          }
          return searchParams.toString()
        },
        timeout: 10000,
      })

      const nextToken = listRes.data?.nextPageToken
      if (!nextToken) {
        // End of messages reached
        return undefined
      }
      tokenMap.set(p + 1, nextToken)
      currentToken = nextToken
    }

    return tokenMap.get(targetPage) || undefined
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

    if (forceRefresh) {
      this.clearPageTokens(accountId, folder, perPage)
    }

    return cacheService.fetchWithCache(
      cacheKey,
      async () => {
        return this.executeWithAuthRetry(accountId, async (token) => {
          const account = this.getAccount(accountId)
          if (!account) {
            throw new Error(`Gmail account "${accountId}" not found.`)
          }

          const gmailLabelId = this.getGmailLabelId(folder)

          console.log('[GmailDebug] Fetching Gmail messages')
          console.log('[GmailDebug] Account:', account.email)
          console.log('[GmailDebug] Account ID:', account.id)
          console.log('[GmailDebug] Provider: gmail')
          console.log('[GmailDebug] Requested folder:', folder)
          console.log('[GmailDebug] Gmail label:', gmailLabelId)
          console.log('[GmailDebug] Page:', page, 'PerPage:', perPage)
          console.log('[GmailDebug] Token exists:', !!token)
          console.log('[GmailDebug] API request started')

          // Retrieve corresponding pageToken for pagination if page > 1
          const pageToken = await this.getPageTokenForPage(
            accountId,
            folder,
            page,
            perPage,
            token,
            gmailLabelId
          )

          const requestParams: Record<string, any> = {
            labelIds: [gmailLabelId],
            maxResults: perPage,
          }
          if (pageToken) {
            requestParams.pageToken = pageToken
          }

          const listRes = await axios.get<{
            messages?: Array<{ id: string; threadId: string }>
            nextPageToken?: string
            resultSizeEstimate?: number
          }>(`${GMAIL_API_BASE}/messages`, {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/json',
            },
            params: requestParams,
            paramsSerializer: (params) => {
              const searchParams = new URLSearchParams()
              for (const [key, value] of Object.entries(params)) {
                if (Array.isArray(value)) {
                  value.forEach((v) => searchParams.append(key, v))
                } else if (value !== undefined && value !== null) {
                  searchParams.append(key, String(value))
                }
              }
              return searchParams.toString()
            },
            timeout: 10000,
          })

          const msgSummaries = listRes.data?.messages || []
          const estimatedTotal = listRes.data?.resultSizeEstimate ?? msgSummaries.length
          const nextPageToken = listRes.data?.nextPageToken

          // Cache the next page's token for fast subsequent navigation
          const pageTokenStoreKey = `${accountId}_${folder}_${perPage}`
          if (!this.pageTokensCache.has(pageTokenStoreKey)) {
            this.pageTokensCache.set(pageTokenStoreKey, new Map<number, string>([[1, '']]))
          }
          const tokenMap = this.pageTokensCache.get(pageTokenStoreKey)!
          if (nextPageToken) {
            tokenMap.set(page + 1, nextPageToken)
          }

          console.log('[GmailDebug] HTTP status:', listRes.status)
          console.log('[GmailDebug] Message count:', msgSummaries.length)
          console.log('[GmailDebug] Result size estimate:', estimatedTotal)
          console.log('[GmailDebug] Has next page token:', !!nextPageToken)

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
                const detailRes = await axios.get<GmailRawMessage>(
                  `${GMAIL_API_BASE}/messages/${item.id}`,
                  {
                    headers: {
                      Authorization: `Bearer ${token}`,
                      Accept: 'application/json',
                    },
                    params: { format: 'full' },
                    timeout: 8000,
                  }
                )
                return this.transformRawMessage(detailRes.data, accountId, folder)
              } catch (detailErr) {
                console.warn(
                  `[GmailDebug] Failed to fetch message details for ID ${item.id}:`,
                  detailErr
                )
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

          // Calculate total and totalPages accurately
          let totalPages = Math.max(1, Math.ceil(estimatedTotal / perPage))
          if (nextPageToken && totalPages <= page) {
            totalPages = page + 1
          } else if (!nextPageToken && page >= totalPages) {
            totalPages = page
          }

          return {
            data: detailedMessages,
            pagination: {
              page,
              perPage,
              total: Math.max(estimatedTotal, (page - 1) * perPage + detailedMessages.length),
              totalPages,
            },
          }
        })
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
        return this.executeWithAuthRetry(accountId, async (token) => {
          try {
            const res = await axios.get<GmailRawMessage>(
              `${GMAIL_API_BASE}/messages/${messageId}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  Accept: 'application/json',
                },
                params: { format: 'full' },
                timeout: 8000,
              }
            )

            const payload = res.data?.payload
            const { text, html, attachments } = this.extractBodyAndAttachments(
              payload,
              messageId
            )
            return { text, html, attachments }
          } catch (err: any) {
            console.error(
              `[GmailDebug] Failed to fetch message body for ${messageId}:`,
              err?.message
            )
            throw new Error(
              err?.response?.data?.error?.message ||
                err?.message ||
                'Failed to retrieve message content.'
            )
          }
        })
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
    return this.executeWithAuthRetry(accountId, async (token) => {
      try {
        const res = await axios.get<GmailAttachmentResponse>(
          `${GMAIL_API_BASE}/messages/${messageId}/attachments/${attachmentId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
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
        console.error(
          `[GmailDebug] Attachment fetch failed for ${attachmentId}:`,
          err?.message
        )
        throw new Error(
          err?.response?.data?.error?.message ||
            err?.message ||
            'Failed to download attachment.'
        )
      }
    })
  }

  /**
   * Convert Gmail raw message payload into standard Message
   */
  private transformRawMessage(
    raw: GmailRawMessage,
    accountId: string,
    folder: MailFolder
  ): Message {
    const headers = raw.payload?.headers || []
    const getHeader = (name: string) =>
      headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || ''

    const fromHeader = getHeader('From')
    const subject = getHeader('Subject') || '(No Subject)'
    const date =
      getHeader('Date') ||
      (raw.internalDate
        ? new Date(Number(raw.internalDate)).toISOString()
        : new Date().toISOString())
    const unread = raw.labelIds?.includes('UNREAD') ?? false

    // Parse sender name & address
    let senderName = fromHeader
    let senderAddress = fromHeader
    const match = fromHeader.match(/^(.*?)\s*<(.+?)>$/)
    if (match) {
      senderName = match[1].replace(/^["']|["']$/g, '').trim() || match[2]
      senderAddress = match[2].trim()
    }

    const { text, html, attachments } = this.extractBodyAndAttachments(
      raw.payload,
      raw.id
    )

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
        return decodeURIComponent(escape(atob(clean)))
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
