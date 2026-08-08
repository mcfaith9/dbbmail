<script setup lang="ts">
import { Button } from '@/components/ui/button'

defineProps<{
  error?: string | null
}>()

const emit = defineEmits<{
  (e: 'refresh'): void
}>()
</script>

<template>
  <div class="flex flex-1 flex-col items-center justify-center p-8 text-sm text-destructive">
    <p class="font-medium">Failed to load mailbox messages</p>
    <p v-if="error" class="text-xs text-muted-foreground mt-1">{{ error }}</p>
    <Button variant="outline" size="sm" class="mt-4" @click="emit('refresh')">
      Try Again
    </Button>
  </div>
</template>
