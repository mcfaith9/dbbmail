<script setup lang="ts">
import { Mail } from '@lucide/vue'

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
</script>

<template>
  <div
    v-if="!selectedMailbox"
    class="flex flex-1 min-w-0 items-center justify-center bg-background p-6"
  >
    <Empty class="max-w-md border-0">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Mail />
        </EmptyMedia>

        <EmptyTitle>Your inbox is waiting</EmptyTitle>

        <EmptyDescription>
          Select an email account to get started.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  </div>
</template>