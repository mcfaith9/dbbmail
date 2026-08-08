<script setup lang="ts">
import { Mail, Clock, User, X } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import type { Message } from '@/types/mail'
import { useMailFormatting } from '@/composables/useMailFormatting'
import MailAttachments from '@/components/mail/MailAttachments.vue'

defineProps<{
  activeMessage: Message | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const { formatDate, formatSender, formatSenderAddress } = useMailFormatting()
</script>

<template>
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

      <Button variant="ghost" size="icon" @click="emit('close')">
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
    <MailAttachments
      v-if="activeMessage.attachments && activeMessage.attachments.length > 0"
      :attachments="activeMessage.attachments"
    />

    <!-- Email Content Body -->
    <div class="py-4 flex-1 text-sm text-foreground leading-relaxed whitespace-pre-wrap font-sans">
      {{ activeMessage.body || activeMessage.snippet || 'No plain text content for this message.' }}
    </div>
  </div>

  <!-- Placeholder when no message selected -->
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
</template>
