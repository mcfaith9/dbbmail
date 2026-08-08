<script setup lang="ts">
import { Paperclip, FileDown } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import type { Attachment } from '@/types/mail'
import { useMailFormatting } from '@/composables/useMailFormatting'

defineProps<{
  attachments: Attachment[]
}>()

const { formatFileSize } = useMailFormatting()
</script>

<template>
  <div
    v-if="attachments && attachments.length > 0"
    class="my-4 p-3 bg-muted/40 rounded-lg border"
  >
    <h4 class="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
      <Paperclip class="h-3.5 w-3.5 text-primary" />
      Attachments ({{ attachments.length }})
    </h4>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
      <div
        v-for="att in attachments"
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
</template>
