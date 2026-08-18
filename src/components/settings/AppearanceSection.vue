<script setup lang="ts">
import { ref } from 'vue'
import {
  Sun,
  Moon,
  Palette,
  Check,
  LayoutGrid,
} from '@lucide/vue'

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { useTheme } from '@/composables/useTheme'

const emit = defineEmits<{
  (e: 'toast', message: string): void
}>()

const { isDark, toggleTheme } = useTheme()

const isCompact = ref(
  typeof window !== 'undefined' && localStorage.getItem('dbb_compact_density') === 'true'
)
const showEmailAvatars = ref(
  typeof window !== 'undefined' ? localStorage.getItem('dbb_show_avatars') !== 'false' : true
)

const handleThemeSelect = (mode: 'light' | 'dark') => {
  if ((mode === 'dark' && !isDark.value) || (mode === 'light' && isDark.value)) {
    toggleTheme()
    emit('toast', `Theme switched to ${mode === 'dark' ? 'Dark Mode' : 'Light Mode'}`)
  }
}

const handleCompactToggle = (val: boolean) => {
  isCompact.value = val
  if (typeof window !== 'undefined') {
    localStorage.setItem('dbb_compact_density', val ? 'true' : 'false')
  }
  emit('toast', val ? 'Compact density activated' : 'Standard density activated')
}

const handleAvatarToggle = (val: boolean) => {
  showEmailAvatars.value = val
  if (typeof window !== 'undefined') {
    localStorage.setItem('dbb_show_avatars', val ? 'true' : 'false')
  }
  emit('toast', val ? 'Sender avatars visible' : 'Sender avatars hidden')
}
</script>

<template>
  <div class="space-y-6">
    <!-- Theme Mode Card -->
    <Card class="border-border shadow-xs">
      <CardHeader class="pb-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="p-2 rounded-lg bg-primary/10 text-primary">
              <Palette class="size-5" />
            </div>
            <div>
              <CardTitle class="text-base font-semibold">Interface Theme</CardTitle>
              <CardDescription class="text-xs">
                Select your preferred color theme for high readability and night use.
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" class="text-[11px] font-medium">
            Active: {{ isDark ? 'Dark Theme' : 'Light Theme' }}
          </Badge>
        </div>
      </CardHeader>

      <CardContent class="space-y-4 pt-2">
        <!-- Visual Theme Cards Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Light Mode Option -->
          <div
            class="relative rounded-xl border-2 p-4 cursor-pointer transition-all hover:border-primary/60 flex flex-col gap-3"
            :class="!isDark ? 'border-primary bg-primary/5 shadow-xs' : 'border-border bg-card'"
            @click="handleThemeSelect('light')"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2 font-semibold text-xs text-foreground">
                <Sun class="size-4 text-amber-500" />
                <span>Light Mode</span>
              </div>
              <div
                v-if="!isDark"
                class="size-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center"
              >
                <Check class="size-3 stroke-[3]" />
              </div>
            </div>

            <!-- Light Preview Box -->
            <div class="rounded-lg border bg-white p-3 space-y-2 text-slate-800 pointer-events-none select-none shadow-xs">
              <div class="flex items-center justify-between border-b pb-1.5">
                <div class="h-2 w-16 bg-slate-200 rounded"></div>
                <div class="size-3 rounded-full bg-slate-300"></div>
              </div>
              <div class="space-y-1">
                <div class="h-2 w-full bg-slate-100 rounded"></div>
                <div class="h-2 w-3/4 bg-slate-100 rounded"></div>
              </div>
            </div>
            <p class="text-[11px] text-muted-foreground">Clean, high-contrast crisp day interface</p>
          </div>

          <!-- Dark Mode Option -->
          <div
            class="relative rounded-xl border-2 p-4 cursor-pointer transition-all hover:border-primary/60 flex flex-col gap-3"
            :class="isDark ? 'border-primary bg-primary/5 shadow-xs' : 'border-border bg-card'"
            @click="handleThemeSelect('dark')"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2 font-semibold text-xs text-foreground">
                <Moon class="size-4 text-primary" />
                <span>Dark Mode</span>
              </div>
              <div
                v-if="isDark"
                class="size-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center"
              >
                <Check class="size-3 stroke-[3]" />
              </div>
            </div>

            <!-- Dark Preview Box -->
            <div class="rounded-lg border border-slate-700 bg-slate-900 p-3 space-y-2 text-slate-100 pointer-events-none select-none shadow-xs">
              <div class="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <div class="h-2 w-16 bg-slate-700 rounded"></div>
                <div class="size-3 rounded-full bg-slate-700"></div>
              </div>
              <div class="space-y-1">
                <div class="h-2 w-full bg-slate-800 rounded"></div>
                <div class="h-2 w-3/4 bg-slate-800 rounded"></div>
              </div>
            </div>
            <p class="text-[11px] text-muted-foreground">OLED & low-light friendly eye comfort</p>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Layout & Typography Preferences -->
    <Card class="border-border shadow-xs">
      <CardHeader class="pb-3">
        <CardTitle class="text-sm font-semibold flex items-center gap-2">
          <LayoutGrid class="size-4 text-primary" />
          <span>Display & Message List Layout</span>
        </CardTitle>
        <CardDescription class="text-xs">
          Customize message density and visual list components.
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-4 pt-2">
        <div class="flex items-center justify-between p-3.5 rounded-lg border bg-card gap-4">
          <div class="space-y-0.5">
            <div class="text-xs font-semibold text-foreground">Compact Message Density</div>
            <p class="text-[11px] text-muted-foreground">
              Display more email items per page with tighter row heights.
            </p>
          </div>
          <Switch
            :checked="isCompact"
            @update:checked="handleCompactToggle"
          />
        </div>

        <div class="flex items-center justify-between p-3.5 rounded-lg border bg-card gap-4">
          <div class="space-y-0.5">
            <div class="text-xs font-semibold text-foreground">Show Sender Gravatar / Avatars</div>
            <p class="text-[11px] text-muted-foreground">
              Display monogram badge initials or sender logos in message lists.
            </p>
          </div>
          <Switch
            :checked="showEmailAvatars"
            @update:checked="handleAvatarToggle"
          />
        </div>
      </CardContent>
    </Card>
  </div>
</template>
