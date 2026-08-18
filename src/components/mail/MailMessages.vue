<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import type {
  Message,
  PaginationInfo,
  MailFolder,
} from '@/types/mail'
import { useMailFormatting } from '@/composables/useMailFormatting'

import MailToolbar from '@/components/mail/MailToolbar.vue'
import MailLoadingState from '@/components/mail/MailLoadingState.vue'
import MailErrorState from '@/components/mail/MailErrorState.vue'
import MailEmptyState from '@/components/mail/MailEmptyState.vue'
import MailMessageRow from '@/components/mail/MailMessageRow.vue'
import MailMessageDetail from '@/components/mail/MailMessageDetail.vue'
import MailPagination from '@/components/mail/MailPagination.vue'
import KeyboardShortcutsDialog from '@/components/mail/KeyboardShortcutsDialog.vue'

const props = withDefaults(
  defineProps<{
    messages: Message[]
    pagination?: PaginationInfo
    loading?: boolean
    error?: string | null
    activeFolder?: MailFolder
  }>(),
  {
    messages: () => [],
    pagination: () => ({
      page: 1,
      perPage: 10,
      total: 0,
      totalPages: 1,
    }),
    loading: false,
    error: null,
    activeFolder: 'INBOX',
  }
)

const emit = defineEmits<{
  (e: 'page-change', page: number): void
  (e: 'per-page-change', perPage: number): void
  (e: 'refresh'): void
  (e: 'message-selected', message: Message | null): void
  (e: 'folder-change', folder: MailFolder): void
}>()

const { formatSender } = useMailFormatting()

const activeMessage = ref<Message | null>(null)
const searchQuery = ref('')
const toolbarRef = ref<InstanceType<typeof MailToolbar> | null>(null)
const showShortcutsDialog = ref(false)

/*
|--------------------------------------------------------------------------
| Split-Pane Resizing & Width Persistence
|--------------------------------------------------------------------------
*/
const DEFAULT_WIDTH = 380
const MIN_WIDTH = 260
const MAX_WIDTH = 720

const savedWidth = typeof window !== 'undefined'
  ? Number(localStorage.getItem('dbb_mail_list_width')) || DEFAULT_WIDTH
  : DEFAULT_WIDTH

const listWidth = ref<number>(Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, savedWidth)))
const isResizing = ref(false)
const splitContainerRef = ref<HTMLElement | null>(null)

function startResize(e: MouseEvent) {
  e.preventDefault()
  isResizing.value = true
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'

  const handleMouseMove = (moveEvent: MouseEvent) => {
    if (!isResizing.value || !splitContainerRef.value) return
    const containerRect = splitContainerRef.value.getBoundingClientRect()
    const newWidth = moveEvent.clientX - containerRect.left
    const clampedWidth = Math.max(MIN_WIDTH, Math.min(Math.min(MAX_WIDTH, containerRect.width - 320), newWidth))
    listWidth.value = clampedWidth
  }

  const handleMouseUp = () => {
    if (isResizing.value) {
      isResizing.value = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      localStorage.setItem('dbb_mail_list_width', listWidth.value.toString())
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }

  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('mouseup', handleMouseUp)
}

/*
|--------------------------------------------------------------------------
| Filtered Messages
|--------------------------------------------------------------------------
*/
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

const handleFolderChange = (folder: MailFolder) => {
  emit('folder-change', folder)
}

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

/*
|--------------------------------------------------------------------------
| Keyboard Shortcuts Navigation
|--------------------------------------------------------------------------
*/
function handleGlobalKeydown(e: KeyboardEvent) {
  // Ignore shortcuts if focused in an input/textarea/select or contenteditable
  const target = e.target as HTMLElement | null
  const isInput = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.tagName === 'SELECT' || target?.isContentEditable

  if (isInput) {
    if (e.key === 'Escape') {
      target?.blur()
    }
    return
  }

  if (e.metaKey || e.ctrlKey || e.altKey) {
    return
  }

  const list = filteredMessages.value
  if (!list.length && e.key !== '?' && e.key !== '/') return

  const currentIndex = activeMessage.value
    ? list.findIndex(m => (m.uid && m.uid === activeMessage.value?.uid) || (m.id && m.id === activeMessage.value?.id))
    : -1

  switch (e.key) {
    case 'j':
    case 'ArrowDown': {
      e.preventDefault()
      const nextIndex = currentIndex < list.length - 1 ? currentIndex + 1 : 0
      selectMessage(list[nextIndex])
      break
    }
    case 'k':
    case 'ArrowUp': {
      e.preventDefault()
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : list.length - 1
      selectMessage(list[prevIndex])
      break
    }
    case 'Enter':
    case 'r': {
      if (currentIndex >= 0 && !activeMessage.value) {
        e.preventDefault()
        selectMessage(list[currentIndex])
      }
      break
    }
    case 'Escape': {
      if (showShortcutsDialog.value) {
        showShortcutsDialog.value = false
      } else if (activeMessage.value) {
        closeDetail()
      } else if (searchQuery.value) {
        clearSearch()
      }
      break
    }
    case '/': {
      e.preventDefault()
      toolbarRef.value?.focusSearch()
      break
    }
    case 'e': {
      // Toggle read status
      if (activeMessage.value) {
        e.preventDefault()
        activeMessage.value.unseen = !activeMessage.value.unseen
        activeMessage.value.unread = !activeMessage.value.unread
      }
      break
    }
    case '?': {
      e.preventDefault()
      showShortcutsDialog.value = !showShortcutsDialog.value
      break
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
})
</script>

<template>
  <div class="flex flex-1 flex-col w-full h-full bg-background overflow-hidden">
    <!-- Search & Toolbar Header -->
    <MailToolbar
      ref="toolbarRef"
      v-model:search-query="searchQuery"
      :pagination="pagination"
      :loading="loading"
      :active-folder="activeFolder"
      @clear-search="clearSearch"
      @refresh="emit('refresh')"
      @folder-change="handleFolderChange"
      @open-shortcuts="showShortcutsDialog = true"
    />

    <!-- Main Table / Detail Split Body -->
    <div
      ref="splitContainerRef"
      class="flex flex-1 min-h-0 overflow-hidden relative"
    >
      <!-- Loading State Overlay (Initial load) -->
      <MailLoadingState v-if="loading && messages.length === 0" />

      <!-- Error State -->
      <MailErrorState v-else-if="error" :error="error" @refresh="emit('refresh')" />

      <!-- Empty State -->
      <MailEmptyState
        v-else-if="filteredMessages.length === 0"
        :is-search-active="!!searchQuery"
        :active-folder="activeFolder"
      />

      <!-- Messages Table + Detail View Split with Resizer -->
      <div v-else class="flex flex-1 h-full w-full min-h-0 overflow-hidden">
        <!-- Messages Table View (Resizable) -->
        <div
          :class="[
            'flex flex-col h-full min-h-0 overflow-y-auto border-r transition-[width]',
            activeMessage ? 'hidden md:flex shrink-0' : 'w-full'
          ]"
          :style="activeMessage ? { width: `${listWidth}px` } : {}"
        >
          <Table>
            <TableHeader class="sticky top-0 z-10 bg-background dark:bg-neutral-800">
              <TableRow>
                <TableHead class="w-[36px] px-2 text-center"></TableHead>
                <TableHead class="w-[160px]">Sender</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead class="w-[130px] text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <!-- Pagination / Folder Change Shimmer Rows -->
              <template v-if="loading">
                <TableRow
                  v-for="i in pagination.perPage"
                  :key="'skeleton-' + i"
                  class="animate-pulse"
                >
                  <TableCell class="w-[36px] px-2 text-center">
                    <Skeleton class="size-3 rounded-full mx-auto" />
                  </TableCell>
                  <TableCell class="w-[160px]">
                    <Skeleton class="h-4 w-28 rounded" />
                  </TableCell>
                  <TableCell>
                    <Skeleton class="h-4 w-4/5 rounded" />
                  </TableCell>
                  <TableCell class="w-[130px] text-right">
                    <Skeleton class="h-4 w-16 ml-auto rounded" />
                  </TableCell>
                </TableRow>
              </template>

              <!-- Real Message Rows -->
              <template v-else>
                <MailMessageRow
                  v-for="msg in filteredMessages"
                  :key="msg.uid || msg.id"
                  :msg="msg"
                  :is-selected="activeMessage?.uid === msg.uid || activeMessage?.id === msg.id"
                  @select="selectMessage"
                />
              </template>
            </TableBody>
          </Table>
        </div>

        <!-- Draggable Resizer Handle (Desktop only when detail is open) -->
        <div
          v-if="activeMessage"
          class="hidden md:flex w-2 hover:w-2.5 bg-border/40 hover:bg-primary/40 cursor-col-resize items-center justify-center transition-all shrink-0 select-none group relative z-20"
          title="Drag to resize split panes"
          @mousedown="startResize"
        >
          <div class="h-8 w-1 rounded-full bg-muted-foreground/30 group-hover:bg-primary" />
        </div>

        <!-- Detail Reading Pane -->
        <MailMessageDetail
          :active-message="activeMessage"
          @close="closeDetail"
        />
      </div>
    </div>

    <!-- Footer Pagination Controls Bar -->
    <MailPagination
      :pagination="pagination"
      :loading="loading"
      @page-change="emit('page-change', $event)"
      @per-page-change="emit('per-page-change', $event)"
    />

    <!-- Keyboard Shortcuts Cheat Sheet Dialog -->
    <KeyboardShortcutsDialog
      v-model:open="showShortcutsDialog"
    />
  </div>
</template>
