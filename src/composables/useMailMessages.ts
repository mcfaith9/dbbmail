import { ref } from 'vue'
import type { Message, PaginationInfo, MailFolder } from '@/types/mail'
import { cacheService } from '@/services/cacheService'

export function useMailMessages() {
  const selectedMailbox = ref<string | null>(null)
  const selectedMailboxResourceId = ref<string | null>(null)
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
  const selectedHostingerAccount =
    ref<HostingerAccount | null>(null)
    
  async function fetchMessages(
    mailboxResourceId: string,
    page = pagination.value.page,
    perPage = pagination.value.perPage,
    folder: MailFolder = activeFolder.value
  ) {
    messagesLoading.value = true
    messagesError.value = null

    try {
      const hostingerAccount =
        selectedHostingerAccount.value

      if (!hostingerAccount) {
        throw new Error(
          'No Hostinger account selected'
        )
      }

      if (!window.hostinger) {
        throw new Error('Hostinger service is not available')
      }

      const cacheKey = `messages_${hostingerAccount}_${mailboxResourceId}_${folder}`
      const settings = cacheService.getSettings()

      const response = await cacheService.fetchWithCache(
        cacheKey,
        () => window.hostinger!.getMailboxMessages(mailboxResourceId, folder, hostingerAccount),
        settings.messagesTtlMs
      )

      let list: Message[] = []

      if (Array.isArray(response.data)) {
        list = response.data
      } else if (response.data && Array.isArray(response.data.messages)) {
        list = response.data.messages
      } else if (Array.isArray(response.messages)) {
        list = response.messages
      } else if (Array.isArray(response)) {
        list = response
      }

      let pag: PaginationInfo = {
        page: page,
        perPage: perPage,
        total: list.length,
        totalPages: Math.ceil(list.length / perPage) || 1,
      }

      if (response.pagination) {
        pag = {
          page: Number(response.pagination.page) || page,
          perPage: Number(response.pagination.perPage) || perPage,
          total: Number(response.pagination.total) || list.length,
          totalPages: Number(response.pagination.totalPages) || Math.ceil(list.length / perPage) || 1,
        }
      } else if (response.data?.pagination) {
        pag = {
          page: Number(response.data.pagination.page) || page,
          perPage: Number(response.data.pagination.perPage) || perPage,
          total: Number(response.data.pagination.total) || list.length,
          totalPages: Number(response.data.pagination.totalPages) || Math.ceil(list.length / perPage) || 1,
        }
      }

      list.forEach((msg) => {
        msg.mailboxResourceId = mailboxResourceId
        msg.hostingerAccount = hostingerAccount
      })

      messages.value = list
      pagination.value = pag
    } catch (err: any) {
      console.error('MESSAGE FETCH ERROR:', err)
      messagesError.value = err.message || 'Failed to load messages'
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
    selectedMailbox.value = email

    selectedMailboxResourceId.value =
      mailboxResourceId

    selectedHostingerAccount.value =
      hostingerAccount

    activeMessage.value = null

    pagination.value.page = 1

    await fetchMessages(
      mailboxResourceId,
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

  function handlePageChange(newPage: number) {
    if (!selectedMailboxResourceId.value) return
    pagination.value.page = newPage
    fetchMessages(selectedMailboxResourceId.value, newPage, pagination.value.perPage)
  }

  function handlePerPageChange(newPerPage: number) {
    if (!selectedMailboxResourceId.value) return
    pagination.value.perPage = newPerPage
    pagination.value.page = 1
    fetchMessages(selectedMailboxResourceId.value, 1, newPerPage)
  }

  function handleRefresh() {
    if (!selectedMailboxResourceId.value) return
    fetchMessages(selectedMailboxResourceId.value, pagination.value.page, pagination.value.perPage)
  }

  async function fetchMessageContent(
    message: Message
  ) {
    if (!message) return

    const mailboxResourceId =
      selectedMailboxResourceId.value

    const hostingerAccount =
      selectedHostingerAccount.value

    const folder =
      (activeFolder.value || 'INBOX').toUpperCase()

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

    const cacheKey = `msg_content_${hostingerAccount}_${mailboxResourceId}_${folder}_${uid}`
    const settings = cacheService.getSettings()

    const cached = cacheService.get<{ text: string; html: string }>(cacheKey)

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
        () => window.hostinger!.getMessageContent(mailboxResourceId, folder, uid, hostingerAccount),
        settings.messagesTtlMs
      )

      const text = response?.data?.text ?? response?.text ?? ''
      const html = response?.data?.html ?? response?.html ?? ''

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
    activeFolder,
    activeMessage,
    messages,
    pagination,
    messagesLoading,
    messagesError,
    fetchMessages,
    handleMailboxSelected,
    handleFolderChange,
    handleMessageSelected,
    handlePageChange,
    handlePerPageChange,
    handleRefresh,
    fetchMessageContent
  }
}
