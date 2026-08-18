<script setup lang="ts">
import { Skeleton } from '@/components/ui/skeleton'
</script>

<template>
  <div class="flex flex-1 flex-col w-full h-full p-4 space-y-3 overflow-hidden">
    <!-- Header Shimmer -->
    <div class="flex items-center justify-between pb-3 border-b border-border/50">
      <div class="flex items-center gap-3">
        <Skeleton class="h-4 w-28 rounded" />
        <Skeleton class="h-4 w-48 rounded" />
      </div>
      <Skeleton class="h-4 w-20 rounded" />
    </div>

    <!-- Table Rows Shimmers -->
    <div class="space-y-2.5 flex-1 overflow-hidden">
      <div
        v-for="i in 8"
        :key="i"
        class="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-card/30 gap-4 animate-pulse"
      >
        <div class="flex items-center gap-3 min-w-0 flex-1">
          <!-- Unread Dot / Icon -->
          <Skeleton class="size-3.5 rounded-full shrink-0" />
          <!-- Sender Name -->
          <Skeleton class="h-4 w-32 shrink-0 rounded" />
          <!-- Subject & snippet -->
          <div class="flex items-center gap-2 flex-1 min-w-0">
            <Skeleton class="h-4 w-40 rounded" />
            <Skeleton class="h-3 w-64 rounded hidden md:block opacity-60" />
          </div>
        </div>

        <!-- Date & Badge -->
        <div class="flex items-center gap-2 shrink-0">
          <Skeleton class="h-4 w-16 rounded" />
        </div>
      </div>
    </div>
  </div>
</template>

