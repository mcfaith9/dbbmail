<script setup lang="ts">
import { computed } from 'vue'
import { Mail, Send, MailWarning } from '@lucide/vue'
import type { MailFolder } from '@/types/mail'

const props = withDefaults(
  defineProps<{
    isSearchActive?: boolean
    activeFolder?: MailFolder
  }>(),
  {
    isSearchActive: false,
    activeFolder: 'INBOX',
  }
)

const emptyState = computed(() => {
  if (props.isSearchActive) {
    return {
      icon: Mail,
      title: 'No messages found',
      description: 'No messages match your search.',
    }
  }

  switch (props.activeFolder) {
    case 'INBOX.Sent':
      return {
        icon: Send,
        title: 'Ready when you are',
        description: 'Messages you send will appear here.',
      }

    case 'INBOX.Junk':
      return {
        icon: MailWarning,
        title: 'Nothing suspicious here',
        description: 'Your junk folder is looking clean.',
      }

    default:
      return {
        icon: Mail,
        title: 'Your inbox is all caught up',
        description: 'There’s nothing new to see right now.',
      }
  }
})
</script>

<template>
  <div class="flex flex-1 items-center justify-center">
    <div class="flex flex-col items-center text-center max-w-sm px-6">
      <div
        class="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4"
      >
        <component
          :is="emptyState.icon"
          class="h-6 w-6 text-muted-foreground"
        />
      </div>

      <h3 class="text-sm font-semibold">
        {{ emptyState.title }}
      </h3>

      <p class="mt-1 text-xs text-muted-foreground">
        {{ emptyState.description }}
      </p>
    </div>
  </div>
</template>