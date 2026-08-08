import { ref } from 'vue'
import type { Message, PaginationInfo } from '@/types/mail'

export function useMailMessages() {
  const selectedMailbox = ref<string | null>(null)
  const selectedMailboxResourceId = ref<string | null>(null)
  const activeFolder = ref<string>('Inbox')
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

  async function fetchMessages(
    mailboxResourceId: string,
    page = pagination.value.page,
    perPage = pagination.value.perPage,
    folderName = activeFolder.value
  ) {
    messagesLoading.value = true
    messagesError.value = null

    try {
      const folder = folderName.toUpperCase()

      const response = await window.hostinger.getMailboxMessages(
        mailboxResourceId,
        folder,
        page,
        perPage
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

  async function handleMailboxSelected(email: string, mailboxResourceId: string) {
    selectedMailbox.value = email
    selectedMailboxResourceId.value = mailboxResourceId
    activeMessage.value = null
    pagination.value.page = 1

    await fetchMessages(mailboxResourceId, 1, pagination.value.perPage, activeFolder.value)
  }

  function handleFolderSelected(folderTitle: string) {
    activeFolder.value = folderTitle
    activeMessage.value = null
    if (selectedMailboxResourceId.value) {
      pagination.value.page = 1
      fetchMessages(selectedMailboxResourceId.value, 1, pagination.value.perPage, folderTitle)
    }
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

  const messageContentCache = new Map<
    string,
    {
      text?: string
      html?: string
    }
  >()

  async function fetchMessageContent(message: Message) {
    if (!message) return

    const mailboxResourceId =
      selectedMailboxResourceId.value

    const folder =
      (activeFolder.value || 'INBOX').toUpperCase()

    const uid = Number(message.uid)

    if (
      !mailboxResourceId ||
      !Number.isFinite(uid) ||
      uid <= 0
    ) {
      console.warn('Invalid message information:', {
        mailboxResourceId,
        folder,
        uid: message.uid,
      })

      return
    }

    const cacheKey =
      `${mailboxResourceId}_${folder}_${uid}`

    const cached = messageContentCache.get(cacheKey)

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
      console.log('Fetching message content:', {
        mailboxResourceId,
        folder,
        uid,
      })

      const response =
        await window.hostinger.getMessageContent(
          mailboxResourceId,
          folder,
          uid
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

      messageContentCache.set(cacheKey, {
        text,
        html,
      })
    } catch (error: unknown) {
      console.error(
        'Failed to fetch message content:',
        error
      )

      message.contentError =
        error instanceof Error
          ? error.message
          : 'Failed to load email message content.'
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
    handleFolderSelected,
    handleMessageSelected,
    handlePageChange,
    handlePerPageChange,
    handleRefresh,
    fetchMessageContent
  }
}
