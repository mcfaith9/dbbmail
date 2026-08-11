<script setup lang="ts">
import { computed } from 'vue'
import DOMPurify from 'dompurify'
import type { Message } from '@/types/mail'
import { Mail, Clock, UserRound, X } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { useMailFormatting } from '@/composables/useMailFormatting'
import MailAttachments from '@/components/mail/MailAttachments.vue'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'

import { Spinner } from '@/components/ui/spinner'

const props = defineProps<{
  activeMessage: Message | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const {
  formatSender,
  formatSenderAddress,
  formatDate,
} = useMailFormatting()

const sanitizedHtml = computed(() => {
  if (!props.activeMessage?.html) {
    return ''
  }

  return DOMPurify.sanitize(
    props.activeMessage.html
  )
})
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
            class="text-xs uppercase tracking-wider font-semibold bg-muted text-muted-foreground px-2 py-0.5 rounded"
          >
            {{ activeMessage.path }}
          </span>
          <span v-if="activeMessage.uid" class="text-xs text-muted-foreground">
            UID: {{ activeMessage.uid }}
          </span>
        </div>
        <h2 class="text-md font-bold text-foreground leading-snug">
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
        <UserRound class="h-4 w-4 text-primary" />
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
      :message="activeMessage"
    />

    <!-- Email Content Body -->
    <!-- Email Content Body -->
    <div
      class="py-4 flex-1 min-h-0 overflow-y-auto text-sm text-foreground font-sans"
    >
      <!-- Loading -->
      <Empty
        v-if="activeMessage?.contentLoading"
        class="flex-1"
      >
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Spinner />
          </EmptyMedia>

          <EmptyTitle>Loading message</EmptyTitle>

          <EmptyDescription>
            Please wait while we load the email content.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>

      <!-- Error -->
      <div
        v-else-if="activeMessage?.contentError"
        class="py-10 text-center text-destructive"
      >
        {{ activeMessage.contentError }}
      </div>

      <!-- HTML Email -->
      <div
        v-else-if="sanitizedHtml"
        class="email-content"
        v-html="sanitizedHtml"
      />

      <!-- Plain Text -->
      <div
        v-else-if="activeMessage?.text"
        class="whitespace-pre-wrap leading-relaxed"
      >
        {{ activeMessage.text }}
      </div>

      <!-- Existing body -->
      <div
        v-else-if="activeMessage?.body"
        class="whitespace-pre-wrap leading-relaxed"
      >
        {{ activeMessage.body }}
      </div>

      <!-- Snippet fallback -->
      <div
        v-else-if="activeMessage?.snippet"
        class="whitespace-pre-wrap leading-relaxed"
      >
        {{ activeMessage.snippet }}
      </div>

      <!-- Nothing -->
      <div
        v-else
        class="py-10 text-center text-muted-foreground"
      >
        No content available for this message.
      </div>
    </div>
  </div>

  <!-- Placeholder when no message selected -->
  <div
    v-else
    class="hidden md:flex w-[240px] shrink-0 flex-col items-center justify-center p-8 text-center bg-muted/10"
  >
    <Mail class="h-10 w-10 mb-3 text-muted-foreground/30" />

    <p class="font-medium text-foreground">
      Ready when you are
    </p>

    <p class="text-xs text-muted-foreground mt-1">
      Pick a message from your inbox to start reading.
    </p>
  </div>
</template>
