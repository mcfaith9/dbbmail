<script setup lang="ts">
import { Clock } from '@lucide/vue'
</script>

<template>
  <div class="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
    <Clock class="mr-2 h-4 w-4 animate-spin" />
    Fetching messages from mail server...
  </div>
</template>
