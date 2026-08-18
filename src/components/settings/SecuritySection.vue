<script setup lang="ts">
import {
  Shield,
  Lock,
  Clock,
  LogOut,
  ShieldCheck,
} from '@lucide/vue'

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import ChangePinCard from '@/components/settings/ChangePinCard.vue'
import { useAuth } from '@/composables/useAuth'

const emit = defineEmits<{
  (e: 'toast', message: string): void
}>()

const {
  lockNow,
  autoLockMinutes,
  lockOnBlur,
  setAutoLockMinutes,
  setLockOnBlur,
} = useAuth()

const handleAutoLockChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  setAutoLockMinutes(target.value)
  emit('toast', `Auto-lock timeout set to ${target.value === '0' ? 'Never' : target.value + ' minutes'}`)
}

const handleLockOnBlurToggle = (val: boolean) => {
  setLockOnBlur(val)
  emit('toast', val ? 'Lock on window blur enabled' : 'Lock on window blur disabled')
}

const handlePinSuccess = (message: string) => {
  emit('toast', message)
}
</script>

<template>
  <div class="space-y-6">
    <!-- Dedicated Change PIN Component -->
    <ChangePinCard
      @success="handlePinSuccess"
      @cancel="emit('toast', 'PIN change cancelled')"
    />

    <!-- Session & Auto-Lock Security Card -->
    <Card class="border-border shadow-xs">
      <CardHeader class="pb-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="p-2 rounded-lg bg-primary/10 text-primary">
              <Shield class="size-5" />
            </div>
            <div>
              <CardTitle class="text-base font-semibold">Session & Lock Preferences</CardTitle>
              <CardDescription class="text-xs">
                Configure how the application protects access when idle or inactive.
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" class="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            <ShieldCheck class="size-3 mr-1" />
            Active Protection
          </Badge>
        </div>
      </CardHeader>

      <CardContent class="space-y-4 pt-2">
        <!-- Auto Lock Timeout -->
        <div class="flex items-center justify-between p-3.5 rounded-lg border bg-card gap-4">
          <div class="space-y-0.5">
            <Label for="auto-lock-select" class="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Clock class="size-3.5 text-primary" />
              <span>Auto-Lock Timeout</span>
            </Label>
            <p class="text-[11px] text-muted-foreground">
              Automatically lock the app and require PIN after a period of inactivity.
            </p>
          </div>

          <select
            id="auto-lock-select"
            class="h-8.5 rounded-md border border-input bg-background px-2.5 py-1 text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary shrink-0"
            :value="autoLockMinutes"
            @change="handleAutoLockChange"
          >
            <option value="5">5 minutes</option>
            <option value="15">15 minutes (Recommended)</option>
            <option value="30">30 minutes</option>
            <option value="60">1 hour</option>
            <option value="0">Never (Unsafe)</option>
          </select>
        </div>

        <!-- Lock on Blur Toggle -->
        <div class="flex items-center justify-between p-3.5 rounded-lg border bg-card gap-4">
          <div class="space-y-0.5">
            <div class="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Lock class="size-3.5 text-primary" />
              <span>Lock on Background / Window Blur</span>
            </div>
            <p class="text-[11px] text-muted-foreground">
              Shield email views when minimizing or switching away from the application.
            </p>
          </div>

          <Switch
            :checked="lockOnBlur"
            @update:checked="handleLockOnBlurToggle"
          />
        </div>

        <!-- Lock Now Action Button -->
        <div class="flex items-center justify-between p-3.5 rounded-lg border bg-destructive/5 border-destructive/20 gap-4">
          <div class="space-y-0.5">
            <div class="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <LogOut class="size-3.5 text-destructive" />
              <span>Immediate Lock</span>
            </div>
            <p class="text-[11px] text-muted-foreground">
              Instantly lock session and return to the PIN login screen.
            </p>
          </div>

          <Button
            variant="destructive"
            size="sm"
            class="h-8 text-xs px-3 shrink-0 gap-1.5"
            @click="lockNow"
          >
            <Lock class="size-3" />
            <span>Lock Now</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
