<script setup lang="ts">
import { TableRow, TableCell } from '@/components/ui/table'
import { Paperclip } from '@lucide/vue'
import type { Message } from '@/types/mail'
import { useMailFormatting } from '@/composables/useMailFormatting'
import { Badge } from '@/components/ui/badge'

defineProps<{
  msg: Message
  isSelected: boolean
}>()

const emit = defineEmits<{
  (e: 'select', message: Message): void
}>()

const { formatDate, formatSender, isUnread } = useMailFormatting()

function getAttachmentFilename(attachment: any) {
  return (
    attachment.filename ??
    attachment.fileName ??
    attachment.name ??
    attachment.file_name ??
    'Attachment'
  )
}

function truncateFilename(filename: string, maxLength = 14) {
  if (filename.length <= maxLength) {
    return filename
  }

  const extensionIndex = filename.lastIndexOf('.')

  if (extensionIndex <= 0) {
    return `${filename.slice(0, maxLength)}…`
  }

  const extension = filename.slice(extensionIndex)
  const name = filename.slice(0, extensionIndex)

  const available = Math.max(
    3,
    maxLength - extension.length - 1
  )

  return `${name.slice(0, available)}…${extension}`
}
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
    <TableCell class="w-[140px] max-w-[140px] px-2 py-3">
      <span class="block truncate text-sm font-medium text-foreground">
        {{ formatSender(msg.from) }}
      </span>
    </TableCell>

    <!-- Subject / Snippet / Attachments -->
    <TableCell class="min-w-0 px-2 py-3">
      <div class="min-w-0">
        <!-- Subject -->
        <span
          class="block truncate text-xs font-semibold text-foreground"
        >
          {{ msg.subject || '(No Subject)' }}
        </span>

        <!-- Snippet -->
        <span
          v-if="msg.snippet"
          class="mt-0.5 block truncate text-[11px] font-normal text-muted-foreground"
        >
          {{ msg.snippet }}
        </span>

        <!-- Attachments -->
        <div
          v-if="msg.attachments?.length"
          class="mt-1 flex min-w-0 items-center gap-1"
        >
          <Paperclip class="h-3 w-3 shrink-0 text-muted-foreground" />

          <div class="flex min-w-0 items-center gap-1 overflow-hidden">
            <Badge
              v-for="(attachment, index) in msg.attachments"
              :key="index"
              variant="destructive"
              class="max-w-[120px] shrink-0 px-1.5 py-0 text-[10px] bg-red-400"
              :title="getAttachmentFilename(attachment)"
            >
              <span class="truncate">
                {{ truncateFilename(getAttachmentFilename(attachment), 14) }}
              </span>
            </Badge>
          </div>
        </div>
      </div>
    </TableCell>

    <!-- Date -->
    <TableCell
      class="w-[100px] px-2 py-3 text-right text-[11px] whitespace-nowrap text-muted-foreground"
    >
      {{ formatDate(msg.date) }}
    </TableCell>
  </TableRow>
</template>
