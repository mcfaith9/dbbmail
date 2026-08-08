<script setup lang="ts">
import { TableRow, TableCell } from '@/components/ui/table'
import { Paperclip } from '@lucide/vue'
import type { Message } from '@/types/mail'
import { useMailFormatting } from '@/composables/useMailFormatting'

defineProps<{
  msg: Message
  isSelected: boolean
}>()

const emit = defineEmits<{
  (e: 'select', message: Message): void
}>()

const { formatDate, formatSender, isUnread } = useMailFormatting()
</script>

<template>
  <TableRow
    :class="[
      'cursor-pointer transition-colors hover:bg-muted/60',
      isSelected ? 'bg-muted/80 font-medium' : '',
      isUnread(msg) ? 'font-semibold text-foreground bg-primary/5' : 'text-muted-foreground'
    ]"
    @click="emit('select', msg)"
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
</template>
