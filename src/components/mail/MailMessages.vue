<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Paperclip } from '@lucide/vue'
import type { Message, PaginationInfo } from '@/types/mail'
import { useMailFormatting } from '@/composables/useMailFormatting'

import MailToolbar from '@/components/mail/MailToolbar.vue'
import MailLoadingState from '@/components/mail/MailLoadingState.vue'
import MailErrorState from '@/components/mail/MailErrorState.vue'
import MailEmptyState from '@/components/mail/MailEmptyState.vue'
import MailMessageRow from '@/components/mail/MailMessageRow.vue'
import MailMessageDetail from '@/components/mail/MailMessageDetail.vue'
import MailPagination from '@/components/mail/MailPagination.vue'

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

const { formatSender } = useMailFormatting()

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
</script>

<template>
  <div class="flex flex-1 flex-col w-full h-full bg-background overflow-hidden">
    <!-- Search & Toolbar Header -->
    <MailToolbar
      v-model:search-query="searchQuery"
      :pagination="pagination"
      :loading="loading"
      @clear-search="clearSearch"
      @refresh="emit('refresh')"
    />

    <!-- Main Table / Detail Split Body -->
    <div class="flex flex-1 min-h-0 overflow-hidden relative">
      <!-- Loading State Overlay / Spinner -->
      <MailLoadingState v-if="loading && messages.length === 0" />

      <!-- Error State -->
      <MailErrorState v-else-if="error" :error="error" @refresh="emit('refresh')" />

      <!-- Empty State -->
      <MailEmptyState
        v-else-if="filteredMessages.length === 0"
        :is-search-active="!!searchQuery"
      />

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
              <MailMessageRow
                v-for="msg in filteredMessages"
                :key="msg.uid || msg.id"
                :msg="msg"
                :is-selected="activeMessage?.uid === msg.uid || activeMessage?.id === msg.id"
                @select="selectMessage"
              />
            </TableBody>
          </Table>
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
  </div>
</template>
