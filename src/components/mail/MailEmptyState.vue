<script setup lang="ts">
import { Inbox } from '@lucide/vue'

defineProps<{
  isSearchActive?: boolean
}>()
</script>

<template>
  <div class="flex flex-1 flex-col items-center justify-center p-8 text-sm text-muted-foreground">
    <Inbox class="h-10 w-10 mb-2 opacity-40" />
    <p class="font-medium">No messages found</p>
    <p class="text-xs text-muted-foreground mt-1">
      {{ isSearchActive ? 'No items match your search query.' : 'This mailbox folder is empty.' }}
    </p>
  </div>
</template>
