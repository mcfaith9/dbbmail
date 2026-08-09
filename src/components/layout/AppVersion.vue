<script setup lang="ts">
defineProps<{
  version: string
}>()
</script>

<template>
  <div class="fixed top-18 right-4 z-50 flex flex-col items-end text-right pointer-events-none select-none"> 
    <div class="flex flex-col">
      <span class="text-xs font-medium">
        v.{{ version }}
      </span>

      <span class="text-[11px] text-muted-foreground">
        DBB Mail App
      </span>
    </div>
  </div>
</template>