<script setup lang="ts">
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Keyboard, ArrowDown, ArrowUp, CornerDownLeft, Search, Archive, X } from '@lucide/vue'

defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
}>()

const shortcuts = [
  {
    category: 'Navigation',
    items: [
      { key: 'j', alt: '↓', description: 'Navigate to next message in list', icon: ArrowDown },
      { key: 'k', alt: '↑', description: 'Navigate to previous message in list', icon: ArrowUp },
      { key: 'Enter', alt: 'r', description: 'Open / focus selected message', icon: CornerDownLeft },
      { key: 'Esc', description: 'Close message detail or clear search', icon: X },
    ],
  },
  {
    category: 'Actions & Management',
    items: [
      { key: '/', description: 'Focus search bar', icon: Search },
      { key: 'e', description: 'Toggle read status', icon: Archive },
      { key: '?', description: 'Show this keyboard shortcuts guide', icon: Keyboard },
    ],
  },
]
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-[480px] p-6">
      <DialogHeader class="pb-2 border-b">
        <div class="flex items-center gap-2.5">
          <div class="p-2 rounded-lg bg-primary/10 text-primary">
            <Keyboard class="size-5" />
          </div>
          <div>
            <DialogTitle class="text-base font-semibold">Keyboard Shortcuts</DialogTitle>
            <DialogDescription class="text-xs text-muted-foreground">
              Accelerate your email workflow with desktop keyboard controls.
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <div class="space-y-5 py-2">
        <div v-for="section in shortcuts" :key="section.category" class="space-y-2.5">
          <div class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {{ section.category }}
          </div>

          <div class="grid grid-cols-1 gap-2">
            <div
              v-for="item in section.items"
              :key="item.key"
              class="flex items-center justify-between p-2.5 rounded-lg border bg-card/60 text-xs"
            >
              <div class="flex items-center gap-2.5 text-foreground">
                <component :is="item.icon" class="size-3.5 text-muted-foreground" />
                <span>{{ item.description }}</span>
              </div>

              <div class="flex items-center gap-1.5 shrink-0">
                <kbd class="px-2 py-0.5 text-[11px] font-mono font-medium rounded border bg-muted/80 text-foreground shadow-2xs">
                  {{ item.key }}
                </kbd>
                <template v-if="item.alt">
                  <span class="text-[10px] text-muted-foreground font-sans">or</span>
                  <kbd class="px-2 py-0.5 text-[11px] font-mono font-medium rounded border bg-muted/80 text-foreground shadow-2xs">
                    {{ item.alt }}
                  </kbd>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
