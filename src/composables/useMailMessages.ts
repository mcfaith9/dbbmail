import { ref } from 'vue'
import type { Message, PaginationInfo, MailFolder } from '@/types/mail'
import type { GmailAccount } from '@/types/gmail'
import { cacheService } from '@/services/cacheService'
import { gmailService } from '@/services/gmailService'

export function useMailMessages() {
  const selectedMailbox = ref<string | null>(null)
  const selectedMailboxResourceId = ref<string | null>(null)
  const selectedProvider = ref<'hostinger' | 'gmail'>('hostinger')
  const selectedGmailAccountId = ref<string | null>(null)
  const activeFolder = ref<MailFolder>('INBOX')
  const activeMessage = ref<Message | null>(null)

  const messages = ref<Message[]>([])
  const pagination = ref<PaginationInfo>({
    page: 1,
    perPage: 10,
    total: 0,
    totalPages: 1,
  })
  const messagesLoading = ref(false)
  const messagesError = ref<string | null>(null)

  type HostingerAccount = 'DMBB' | 'DBB'
  const selectedHostingerAccount = ref<HostingerAccount | null>(null)

  async function fetchMessages(
    mailboxResourceId: string,
    page = pagination.value.page,
    perPage = pagination.value.perPage,
    folder: MailFolder = activeFolder.value,
    forceRefresh = false
  ) {
    messagesLoading.value = true
    messagesError.value = null

    // -------------------------------------------------------------
    // Gmail Provider Handling
    // -------------------------------------------------------------
    if (selectedProvider.value === 'gmail') {
      try {
        const accountId = selectedGmailAccountId.value || mailboxResourceId
        const result = await gmailService.getMessages(
          accountId,
          folder,
          page,
          perPage,
          forceRefresh
        )

        messages.value = result.data
        pagination.value = result.pagination
      } catch (err: any) {
        console.error('[Gmail] Message fetch error:', err)
        messagesError.value = err?.message || 'Failed to load Gmail messages'
        messages.value = []
      } finally {
        messagesLoading.value = false
      }
      return
    }

    // -------------------------------------------------------------
    // Hostinger Provider Handling (Existing Implementation Preserved)
    // -------------------------------------------------------------
    try {
      const hostingerAccount = selectedHostingerAccount.value

      if (!hostingerAccount) {
        throw new Error('No Hostinger account selected')
      }

      if (!window.hostinger) {
        throw new Error('Hostinger service is not available')
      }

      const cacheKey =
        `messages_${hostingerAccount}_${mailboxResourceId}_${folder}_${page}_${perPage}`

      const settings = cacheService.getSettings()

      let response

      if (forceRefresh) {
        // IMPORTANT: Refresh must bypass the existing cache.
        response = await window.hostinger.getMailboxMessages(
          mailboxResourceId,
          folder,
          hostingerAccount,
          page,
          perPage
        )
      } else {
        response = await cacheService.fetchWithCache(
          cacheKey,
          () => {
            return window.hostinger!.getMailboxMessages(
              mailboxResourceId,
              folder,
              hostingerAccount,
              page,
              perPage
            )
          },
          settings.messagesTtlMs
        )
      }

      let list: Message[] = []

      if (Array.isArray(response?.data)) {
        list = response.data
      } else if (
        response?.data &&
        Array.isArray(response.data.messages)
      ) {
        list = response.data.messages
      } else if (Array.isArray(response?.messages)) {
        list = response.messages
      } else if (Array.isArray(response)) {
        list = response
      }

      const apiPagination =
        response?.pagination ??
        response?.data?.pagination

      const total =
        Number(apiPagination?.total) || list.length

      const pag: PaginationInfo = {
        page:
          Number(apiPagination?.page) || page,

        perPage:
          Number(apiPagination?.perPage) || perPage,

        total,

        totalPages:
          Number(apiPagination?.totalPages) ||
          Math.ceil(total / perPage) ||
          1,
      }

      list.forEach((msg) => {
        msg.mailboxResourceId = mailboxResourceId
        msg.hostingerAccount = hostingerAccount
        msg.provider = 'hostinger'
      })

      messages.value = list
      pagination.value = pag

    } catch (err: any) {
      console.error('MESSAGE FETCH ERROR:', err)

      messagesError.value =
        err?.message || 'Failed to load messages'

      messages.value = []
    } finally {
      messagesLoading.value = false
    }
  }

  async function handleMailboxSelected(
    email: string,
    mailboxResourceId: string,
    hostingerAccount: HostingerAccount
  ) {
    selectedProvider.value = 'hostinger'
    selectedGmailAccountId.value = null
    selectedMailbox.value = email
    selectedMailboxResourceId.value = mailboxResourceId
    selectedHostingerAccount.value = hostingerAccount
    activeMessage.value = null
    pagination.value.page = 1

    await fetchMessages(
      mailboxResourceId,
      1,
      pagination.value.perPage,
      activeFolder.value
    )
  }

  async function handleGmailAccountSelected(account: GmailAccount) {
    selectedProvider.value = 'gmail'
    selectedGmailAccountId.value = account.id
    selectedMailbox.value = account.email
    selectedMailboxResourceId.value = account.id
    selectedHostingerAccount.value = null
    activeMessage.value = null
    pagination.value.page = 1

    await fetchMessages(
      account.id,
      1,
      pagination.value.perPage,
      activeFolder.value
    )
  }

  async function handleFolderChange(folder: MailFolder) {
    if (activeFolder.value === folder) return

    activeFolder.value = folder
    activeMessage.value = null
    pagination.value.page = 1

    if (!selectedMailboxResourceId.value) return

    await fetchMessages(
      selectedMailboxResourceId.value,
      1,
      pagination.value.perPage,
      folder
    )
  }

  async function handleMessageSelected(msg: Message | null) {
    activeMessage.value = msg

    if (msg) {
      await fetchMessageContent(msg)
    }
  }

  async function handlePageChange(newPage: number) {
    if (!selectedMailboxResourceId.value) return

    if (
      newPage < 1 ||
      newPage > pagination.value.totalPages
    ) {
      return
    }

    pagination.value.page = newPage

    await fetchMessages(
      selectedMailboxResourceId.value,
      newPage,
      pagination.value.perPage,
      activeFolder.value
    )
  }

  async function handlePerPageChange(newPerPage: number) {
    if (!selectedMailboxResourceId.value) return

    pagination.value.perPage = newPerPage
    pagination.value.page = 1

    await fetchMessages(
      selectedMailboxResourceId.value,
      1,
      newPerPage,
      activeFolder.value
    )
  }

  async function handleRefresh() {
    if (!selectedMailboxResourceId.value) return

    await fetchMessages(
      selectedMailboxResourceId.value,
      pagination.value.page,
      pagination.value.perPage,
      activeFolder.value,
      true
    )
  }

  async function fetchMessageContent(message: Message) {
    if (!message) return

    // -------------------------------------------------------------
    // Gmail Message Content Handling
    // -------------------------------------------------------------
    if (message.provider === 'gmail' || selectedProvider.value === 'gmail') {
      const accountId = message.gmailAccountId || selectedGmailAccountId.value || selectedMailboxResourceId.value
      const messageId = String(message.gmailMessageId || message.id || message.uid)

      if (!accountId || !messageId) return

      message.contentLoading = true
      message.contentError = null

      try {
        const content = await gmailService.getMessageContent(accountId, messageId)
        if (content.text !== undefined) message.text = content.text
        if (content.html !== undefined) message.html = content.html
        if (content.attachments && content.attachments.length > 0) {
          message.attachments = content.attachments
        }
      } catch (err: any) {
        console.error('[Gmail] Failed to fetch message content:', err)
        message.contentError = err?.message || 'Failed to load Gmail content.'
      } finally {
        message.contentLoading = false
      }
      return
    }

    // -------------------------------------------------------------
    // Hostinger Message Content Handling (Preserved)
    // -------------------------------------------------------------
    const mailboxResourceId = selectedMailboxResourceId.value
    const hostingerAccount = selectedHostingerAccount.value
    const folder = activeFolder.value || 'INBOX'
    const uid = Number(message.uid)

    if (
      !mailboxResourceId ||
      !hostingerAccount ||
      !uid ||
      !window.hostinger
    ) {
      console.warn(
        'Cannot fetch message content:',
        {
          mailboxResourceId,
          hostingerAccount,
          folder,
          uid,
        }
      )

      return
    }

    const cacheKey =
      `msg_content_${hostingerAccount}_${mailboxResourceId}_${folder}_${uid}`

    const settings = cacheService.getSettings()

    const cached =
      cacheService.get<{ text: string; html: string }>(cacheKey)

    if (cached) {
      message.text = cached.text
      message.html = cached.html
      message.contentLoading = false
      message.contentError = null
      return
    }

    message.contentLoading = true
    message.contentError = null

    try {
      const response = await cacheService.fetchWithCache(
        cacheKey,
        () =>
          window.hostinger!.getMessageContent(
            mailboxResourceId,
            folder,
            uid,
            hostingerAccount
          ),
        settings.messagesTtlMs
      )

      const text =
        response?.data?.text ??
        response?.text ??
        ''

      const html =
        response?.data?.html ??
        response?.html ??
        ''

      message.text = text
      message.html = html
    } catch (error: any) {
      console.error(
        '[Mail] Failed to fetch message content:',
        error
      )

      message.contentError =
        error?.message ||
        'Failed to load email message content.'
    } finally {
      message.contentLoading = false
    }
  }

  return {
    selectedMailbox,
    selectedMailboxResourceId,
    selectedProvider,
    selectedGmailAccountId,
    activeFolder,
    activeMessage,
    messages,
    pagination,
    messagesLoading,
    messagesError,
    fetchMessages,
    handleMailboxSelected,
    handleGmailAccountSelected,
    handleFolderChange,
    handleMessageSelected,
    handlePageChange,
    handlePerPageChange,
    handleRefresh,
    fetchMessageContent,
  }
}
