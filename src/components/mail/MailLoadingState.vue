<script setup lang="ts">
import { Spinner } from '@/components/ui/spinner'
</script>

<template>
  <div
    class="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-sm text-muted-foreground"
  >
    <Spinner class="size-5" />

    <div class="flex flex-col items-center gap-1 text-center">
      <p class="text-sm font-medium text-foreground">
        Getting things ready…
      </p>

      <span class="text-xs text-muted-foreground">
        Syncing your inbox and checking for new mail.
      </span>
    </div>
  </div>
</template>
