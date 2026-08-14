<script setup lang="ts">
import { computed } from 'vue'
import {
  Search,
  X,
  RefreshCw,
  Inbox,
  Send,
  MailWarning,
} from '@lucide/vue'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import type {
  PaginationInfo,
  MailFolder,
} from '@/types/mail'


const props = withDefaults(
  defineProps<{
    searchQuery?: string
    pagination?: PaginationInfo
    loading?: boolean
    activeFolder?: MailFolder
  }>(),
  {
    searchQuery: '',
    pagination: () => ({
      page: 1,
      perPage: 10,
      total: 0,
      totalPages: 1,
    }),
    loading: false,
    activeFolder: 'INBOX',
  }
)

const emit = defineEmits<{
  (e: 'update:searchQuery', value: string): void
  (e: 'clear-search'): void
  (e: 'refresh'): void
  (e: 'folder-change', folder: MailFolder): void
}>()

const pageRangeStart = computed(() => {
  if (!props.pagination.total) return 0

  return (
    (props.pagination.page - 1) * props.pagination.perPage + 1
  )
})

const pageRangeEnd = computed(() => {
  if (!props.pagination.total) return 0

  return Math.min(
    props.pagination.page * props.pagination.perPage,
    props.pagination.total
  )
})

const selectFolder = (folder: MailFolder) => {
  if (props.activeFolder === folder) return

  emit('folder-change', folder)
}
</script>

<template>
  <div
    class="flex items-center justify-between gap-4 border-b p-3 bg-card/40 shrink-0"
  >
    <!-- Search + Folder Buttons -->
    <div class="flex items-center gap-2 min-w-0 flex-1">
      <!-- Search -->
      <div class="relative flex-1 max-w-[280px] min-w-[100px]">
        <Search
          class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
        />

        <Input
          :model-value="searchQuery"
          placeholder="Filter messages by sender, subject..."
          class="pl-9 pr-8 h-9 text-xs"
          @input="
            emit(
              'update:searchQuery',
              ($event.target as HTMLInputElement).value
            )
          "
        />

        <Button
          v-if="searchQuery"
          variant="ghost"
          size="icon"
          class="absolute right-1 top-1 h-7 w-7 text-muted-foreground hover:text-foreground"
          @click="emit('clear-search')"
        >
          <X class="h-3.5 w-3.5" />
        </Button>
      </div>

      <!-- Mail Folder Button Group -->
      <ButtonGroup class="shrink-0">
        <Button
          :variant="activeFolder === 'INBOX' ? 'default' : 'outline'"
          size="sm"
          class="h-8 gap-1.5 text-xs"
          :disabled="loading"
          @click="selectFolder('INBOX')"
        >
          <Inbox class="h-3.5 w-3.5" />
        </Button>

        <Button
          :variant="activeFolder === 'INBOX.Sent' ? 'default' : 'outline'"
          size="sm"
          class="h-8 gap-1.5 text-xs"
          :disabled="loading"
          @click="selectFolder('INBOX.Sent')"
        >
          <Send class="h-3.5 w-3.5" />
        </Button>

        <Button
          :variant="activeFolder === 'INBOX.Junk' ? 'default' : 'outline'"
          size="sm"
          class="h-8 gap-1.5 text-xs"
          :disabled="loading"
          @click="selectFolder('INBOX.Junk')"
        >
          <MailWarning class="h-3.5 w-3.5" />
        </Button>
      </ButtonGroup>
    </div>

    <!-- Pagination + Refresh -->
    <div class="flex items-center gap-2 shrink-0">
      <span class="text-xs text-muted-foreground hidden sm:inline">
        <template v-if="pagination.total > 0">
          Showing {{ pageRangeStart }}–{{ pageRangeEnd }} of
          {{ pagination.total }}
        </template>
      </span>

      <Button
        variant="outline"
        size="sm"
        class="h-8 gap-1.5 text-xs"
        :disabled="loading"
        @click="emit('refresh')"
      >
        <RefreshCw
          :class="[
            'h-3.5 w-3.5',
            loading ? 'animate-spin' : '',
          ]"
        />
        <span class="hidden sm:inline">Refresh</span>
      </Button>
    </div>
  </div>
</template>