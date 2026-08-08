<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Mail,
  Clock,
  User,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Paperclip,
  Search,
  RefreshCw,
  FileDown,
  Inbox,
} from '@lucide/vue'

interface Attachment {
  id: string
  contentType?: string
  sizeBytes?: number
  inline?: boolean
  filename?: string
}

interface Message {
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
}

interface PaginationInfo {
  page: number
  perPage: number
  total: number
  totalPages: number
}

const props = withDefaults(
  defineProps<{
    messages: Message[]
    pagination?: PaginationInfo
    loading?: boolean
    error?: string | null
  }>(),
  {
    messages: () => [],
    pagination: () => ({ page: 1, perPage: 10, total: 0, totalPages: 1 }),
    loading: false,
    error: null,
  }
)

const emit = defineEmits<{
  (e: 'page-change', page: number): void
  (e: 'per-page-change', perPage: number): void
  (e: 'refresh'): void
  (e: 'message-selected', message: Message | null): void
}>()

const activeMessage = ref<Message | null>(null)
const searchQuery = ref('')

const filteredMessages = computed(() => {
  if (!searchQuery.value.trim()) {
    return props.messages
  }
  const query = searchQuery.value.toLowerCase()
  return props.messages.filter((msg) => {
    const sender = formatSender(msg.from).toLowerCase()
    const subject = (msg.subject || '').toLowerCase()
    const snippet = (msg.snippet || '').toLowerCase()
    const body = (msg.body || '').toLowerCase()
    return (
      sender.includes(query) ||
      subject.includes(query) ||
      snippet.includes(query) ||
      body.includes(query)
    )
  })
})

const pageRangeStart = computed(() => {
  if (!props.pagination.total) return 0
  return (props.pagination.page - 1) * props.pagination.perPage + 1
})

const pageRangeEnd = computed(() => {
  if (!props.pagination.total) return 0
  return Math.min(
    props.pagination.page * props.pagination.perPage,
    props.pagination.total
  )
})

function clearSearch() {
  searchQuery.value = ''
}

function selectMessage(msg: Message) {
  activeMessage.value = msg
  msg.unseen = false
  msg.unread = false
  emit('message-selected', msg)
}

function closeDetail() {
  activeMessage.value = null
  emit('message-selected', null)
}

function formatDate(dateStr?: string) {
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

function formatSender(from?: { name?: string; address?: string } | string) {
  if (!from) return 'Unknown Sender'
  if (typeof from === 'string') return from
  return from.name || from.address || 'Unknown Sender'
}

function formatSenderAddress(from?: { name?: string; address?: string } | string) {
  if (!from) return ''
  if (typeof from === 'string') return from
  return from.address ? `<${from.address}>` : ''
}

function formatFileSize(bytes?: number) {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function isUnread(msg: Message) {
  if (msg.unseen !== undefined) return msg.unseen
  if (msg.unread !== undefined) return msg.unread
  if (msg.flags && Array.isArray(msg.flags)) {
    return !msg.flags.includes('\\Seen')
  }
  return false
}

function changePage(page: number) {
  if (page >= 1 && page <= props.pagination.totalPages) {
    emit('page-change', page)
  }
}

function changePerPage(event: Event) {
  const target = event.target as HTMLSelectElement
  const val = parseInt(target.value, 10)
  if (val) {
    emit('per-page-change', val)
  }
}
</script>

<template>
  <div class="flex flex-1 flex-col w-full h-full bg-background overflow-hidden">
    <!-- Search & Toolbar Header -->
    <div class="flex items-center justify-between gap-4 border-b p-3 bg-card/40 shrink-0">
      <div class="relative flex-1 max-w-sm">
        <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          v-model="searchQuery"
          placeholder="Filter messages by sender, subject..."
          class="pl-9 pr-8 h-9 text-xs"
        />
        <Button
          v-if="searchQuery"
          variant="ghost"
          size="icon"
          class="absolute right-1 top-1 h-7 w-7 text-muted-foreground hover:text-foreground"
          @click="clearSearch"
        >
          <X class="h-3.5 w-3.5" />
        </Button>
      </div>

      <div class="flex items-center gap-2">
        <span class="text-xs text-muted-foreground hidden sm:inline">
          <template v-if="pagination.total > 0">
            Showing {{ pageRangeStart }}–{{ pageRangeEnd }} of {{ pagination.total }}
          </template>
        </span>

        <Button
          variant="outline"
          size="sm"
          class="h-8 gap-1.5 text-xs"
          :disabled="loading"
          @click="emit('refresh')"
        >
          <RefreshCw :class="['h-3.5 w-3.5', loading ? 'animate-spin' : '']" />
          <span class="hidden sm:inline">Refresh</span>
        </Button>
      </div>
    </div>

    <!-- Main Table / Detail Split Body -->
    <div class="flex flex-1 min-h-0 overflow-hidden relative">
      <!-- Loading State Overlay / Spinner -->
      <div
        v-if="loading && messages.length === 0"
        class="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground"
      >
        <Clock class="mr-2 h-4 w-4 animate-spin" />
        Fetching messages from mail server...
      </div>

      <!-- Error State -->
      <div
        v-else-if="error"
        class="flex flex-1 flex-col items-center justify-center p-8 text-sm text-destructive"
      >
        <p class="font-medium">Failed to load mailbox messages</p>
        <p class="text-xs text-muted-foreground mt-1">{{ error }}</p>
        <Button variant="outline" size="sm" class="mt-4" @click="emit('refresh')">
          Try Again
        </Button>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="filteredMessages.length === 0"
        class="flex flex-1 flex-col items-center justify-center p-8 text-sm text-muted-foreground"
      >
        <Inbox class="h-10 w-10 mb-2 opacity-40" />
        <p class="font-medium">No messages found</p>
        <p class="text-xs text-muted-foreground mt-1">
          {{ searchQuery ? 'No items match your search query.' : 'This mailbox folder is empty.' }}
        </p>
      </div>

      <!-- Messages Table + Detail View Split -->
      <div v-else class="flex flex-1 h-full w-full min-h-0 overflow-hidden">
        <!-- Messages Table View -->
        <div
          :class="[
            'flex flex-col h-full min-h-0 overflow-y-auto border-r transition-all',
            activeMessage ? 'w-full md:w-[320px] lg:w-[380px] shrink-0 hidden md:flex' : 'w-full'
          ]"
        >
          <Table>
            <TableHeader class="sticky top-0 z-10 bg-background">
              <TableRow>
                <TableHead class="w-[36px] px-2 text-center"></TableHead>
                <TableHead class="w-[160px]">Sender</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead class="w-[40px] text-center px-1">
                  <Paperclip class="h-3.5 w-3.5 mx-auto text-muted-foreground" />
                </TableHead>
                <TableHead class="w-[130px] text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow
                v-for="msg in filteredMessages"
                :key="msg.uid || msg.id"
                :class="[
                  'cursor-pointer transition-colors hover:bg-muted/60',
                  activeMessage?.uid === msg.uid || activeMessage?.id === msg.id
                    ? 'bg-muted/80 font-medium'
                    : '',
                  isUnread(msg) ? 'font-semibold text-foreground bg-primary/5' : 'text-muted-foreground'
                ]"
                @click="selectMessage(msg)"
              >
                <!-- Status Dot -->
                <TableCell class="px-2 text-center">
                  <span
                    v-if="isUnread(msg)"
                    class="h-2 w-2 rounded-full bg-primary inline-block"
                    title="Unread message"
                  />
                </TableCell>

                <!-- Sender -->
                <TableCell class="truncate max-w-[160px] py-3">
                  <span class="truncate block text-sm font-medium text-foreground">
                    {{ formatSender(msg.from) }}
                  </span>
                </TableCell>

                <!-- Subject & Snippet -->
                <TableCell class="py-3">
                  <div class="flex flex-col max-w-[320px]">
                    <span class="text-xs font-semibold text-foreground truncate">
                      {{ msg.subject || '(No Subject)' }}
                    </span>
                    <span
                      v-if="msg.snippet"
                      class="text-[11px] text-muted-foreground truncate font-normal mt-0.5"
                    >
                      {{ msg.snippet }}
                    </span>
                  </div>
                </TableCell>

                <!-- Attachment Icon -->
                <TableCell class="px-1 text-center py-3">
                  <span
                    v-if="msg.attachments && msg.attachments.length > 0"
                    class="inline-flex items-center justify-center text-xs text-primary font-medium bg-primary/10 rounded px-1.5 py-0.5"
                    :title="`${msg.attachments.length} attachment(s)`"
                  >
                    <Paperclip class="h-3 w-3 mr-0.5" />
                    {{ msg.attachments.length }}
                  </span>
                </TableCell>

                <!-- Date -->
                <TableCell class="text-right text-[11px] whitespace-nowrap py-3 text-muted-foreground">
                  {{ formatDate(msg.date) }}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <!-- Detail Reading Pane -->
        <div
          v-if="activeMessage"
          class="flex-1 min-w-0 flex flex-col h-full overflow-y-auto bg-background p-6 lg:p-8 border-l"
        >
          <!-- Detail Header -->
          <div class="flex items-start justify-between pb-4 border-b gap-4">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <span
                  v-if="activeMessage.path"
                  class="text-[10px] uppercase tracking-wider font-semibold bg-muted text-muted-foreground px-2 py-0.5 rounded"
                >
                  {{ activeMessage.path }}
                </span>
                <span v-if="activeMessage.uid" class="text-xs text-muted-foreground">
                  UID: {{ activeMessage.uid }}
                </span>
              </div>
              <h2 class="text-lg font-bold text-foreground leading-snug">
                {{ activeMessage.subject || '(No Subject)' }}
              </h2>
            </div>

            <Button variant="ghost" size="icon" @click="closeDetail">
              <X class="h-4 w-4" />
            </Button>
          </div>

          <!-- Sender & Receiver Meta -->
          <div class="py-4 border-b flex flex-col gap-1 text-xs text-muted-foreground">
            <div class="flex items-center gap-2 text-foreground font-medium text-sm">
              <User class="h-4 w-4 text-primary" />
              <span>{{ formatSender(activeMessage.from) }}</span>
              <span class="text-xs font-normal text-muted-foreground">
                {{ formatSenderAddress(activeMessage.from) }}
              </span>
            </div>

            <div class="flex items-center gap-2 mt-1">
              <Clock class="h-3.5 w-3.5" />
              <span>Date: {{ formatDate(activeMessage.date) }}</span>
            </div>
          </div>

          <!-- Attachments List -->
          <div
            v-if="activeMessage.attachments && activeMessage.attachments.length > 0"
            class="my-4 p-3 bg-muted/40 rounded-lg border"
          >
            <h4 class="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
              <Paperclip class="h-3.5 w-3.5 text-primary" />
              Attachments ({{ activeMessage.attachments.length }})
            </h4>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div
                v-for="att in activeMessage.attachments"
                :key="att.id"
                class="flex items-center justify-between p-2 rounded border bg-card text-xs"
              >
                <div class="truncate mr-2">
                  <p class="font-medium truncate text-foreground">
                    {{ att.filename || 'Attachment' }}
                  </p>
                  <p class="text-[10px] text-muted-foreground">
                    {{ formatFileSize(att.sizeBytes) }}
                  </p>
                </div>
                <Button variant="ghost" size="icon" class="h-7 w-7 shrink-0">
                  <FileDown class="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>

          <!-- Email Content Body -->
          <div class="py-4 flex-1 text-sm text-foreground leading-relaxed whitespace-pre-wrap font-sans">
            {{ activeMessage.body || activeMessage.snippet || 'No plain text content for this message.' }}
          </div>
        </div>

        <div
          v-else
          class="hidden md:flex flex-1 flex-col items-center justify-center p-8 text-sm text-muted-foreground bg-muted/10"
        >
          <Mail class="h-10 w-10 mb-2 text-muted-foreground/30" />
          <p class="font-medium text-foreground">Select an email message</p>
          <p class="text-xs text-muted-foreground mt-0.5">
            Click on any row in the table to view the message body.
          </p>
        </div>
      </div>
    </div>

    <!-- Footer Pagination Controls Bar -->
    <div
      v-if="pagination && pagination.total > 0"
      class="flex flex-col sm:flex-row items-center justify-between gap-3 border-t p-3 bg-card/60 text-xs text-muted-foreground"
    >
      <!-- Rows per page selector & status -->
      <div class="flex items-center gap-3">
        <span class="text-xs">Rows per page:</span>
        <select
          :value="pagination.perPage"
          class="h-8 rounded border bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          @change="changePerPage"
        >
          <option :value="5">5</option>
          <option :value="10">10</option>
          <option :value="25">25</option>
          <option :value="50">50</option>
        </select>

        <span class="hidden sm:inline">
          Showing {{ pageRangeStart }}–{{ pageRangeEnd }} of {{ pagination.total }} items
        </span>
      </div>

      <!-- Page navigation buttons -->
      <div class="flex items-center gap-1.5">
        <span class="mr-2 font-medium text-foreground">
          Page {{ pagination.page }} of {{ pagination.totalPages }}
        </span>

        <Button
          variant="outline"
          size="icon"
          class="h-8 w-8"
          :disabled="pagination.page <= 1 || loading"
          @click="changePage(1)"
          title="First Page"
        >
          <ChevronsLeft class="h-3.5 w-3.5" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          class="h-8 w-8"
          :disabled="pagination.page <= 1 || loading"
          @click="changePage(pagination.page - 1)"
          title="Previous Page"
        >
          <ChevronLeft class="h-3.5 w-3.5" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          class="h-8 w-8"
          :disabled="pagination.page >= pagination.totalPages || loading"
          @click="changePage(pagination.page + 1)"
          title="Next Page"
        >
          <ChevronRight class="h-3.5 w-3.5" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          class="h-8 w-8"
          :disabled="pagination.page >= pagination.totalPages || loading"
          @click="changePage(pagination.totalPages)"
          title="Last Page"
        >
          <ChevronsRight class="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  </div>
</template>
