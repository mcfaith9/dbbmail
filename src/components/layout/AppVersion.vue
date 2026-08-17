<script setup lang="ts">
defineProps<{
  version: string
}>()
</script>

<template>
  <div class="fixed -bottom-0 right-0 z-50 flex flex-col items-end text-left pointer-events-none select-none bg-white"> 
    <div class="flex flex-col">
      <span class="text-[10px] font-medium dark:text-gray-200 dark:bg-neutral-800">
        v.{{ version }} DBB APP
      </span>

      <!-- <span class="text-[11px] text-muted-foreground">
        DBB APP
      </span> -->
    </div>
  </div>
</template>