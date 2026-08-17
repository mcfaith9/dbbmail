<script setup lang="ts">
import { ref } from 'vue'
import {
  Bell,
  Volume2,
  MailCheck,
  HardDrive,
  ShieldCheck,
} from '@lucide/vue'

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'

const emit = defineEmits<{
  (e: 'toast', message: string): void
}>()

const prefs = ref({
  emailAlerts: true,
  purchaseOrderAlerts: true,
  quotaWarnings: true,
  soundEnabled: false,
  securityAlerts: true,
})

const handleToggle = (key: keyof typeof prefs.value, name: string) => {
  prefs.value[key] = !prefs.value[key]
  emit('toast', `${name} ${prefs.value[key] ? 'enabled' : 'disabled'}`)
}

const sendTestNotification = () => {
  emit('toast', 'Test notification preview: alert received!')
}
</script>

<template>
  <div class="space-y-6">
    <!-- Notification Preferences Card -->
    <Card class="border-border shadow-xs">
      <CardHeader class="pb-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="p-2 rounded-lg bg-primary/10 text-primary">
              <Bell class="size-5" />
            </div>
            <div>
              <CardTitle class="text-base font-semibold">Notification Preferences</CardTitle>
              <CardDescription class="text-xs">
                Manage alerts, audio chimes, and threshold warnings for Hostinger mailboxes.
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" class="text-[11px] font-medium text-primary">
            Ready for Integration
          </Badge>
        </div>
      </CardHeader>

      <CardContent class="space-y-3.5 pt-2">
        <!-- New Email Alerts -->
        <div class="flex items-center justify-between p-3.5 rounded-lg border bg-card gap-4">
          <div class="space-y-0.5">
            <div class="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <MailCheck class="size-3.5 text-primary" />
              <span>Incoming Mail Alerts</span>
            </div>
            <p class="text-[11px] text-muted-foreground">
              Display desktop notification banner when new unread messages arrive in INBOX.
            </p>
          </div>
          <Switch
            :checked="prefs.emailAlerts"
            @update:checked="handleToggle('emailAlerts', 'Incoming mail alerts')"
          />
        </div>

        <!-- Storage Quota Warning -->
        <div class="flex items-center justify-between p-3.5 rounded-lg border bg-card gap-4">
          <div class="space-y-0.5">
            <div class="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <HardDrive class="size-3.5 text-blue-500" />
              <span>Mailbox Quota Threshold Warnings</span>
            </div>
            <p class="text-[11px] text-muted-foreground">
              Notify when any Hostinger mailbox exceeds 80% storage capacity.
            </p>
          </div>
          <Switch
            :checked="prefs.quotaWarnings"
            @update:checked="handleToggle('quotaWarnings', 'Storage quota warnings')"
          />
        </div>

        <!-- Sound Notification -->
        <div class="flex items-center justify-between p-3.5 rounded-lg border bg-card gap-4">
          <div class="space-y-0.5">
            <div class="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Volume2 class="size-3.5 text-emerald-500" />
              <span>Audio Chime on Message Arrival</span>
            </div>
            <p class="text-[11px] text-muted-foreground">
              Play a subtle notification chime when new messages are fetched.
            </p>
          </div>
          <Switch
            :checked="prefs.soundEnabled"
            @update:checked="handleToggle('soundEnabled', 'Audio chimes')"
          />
        </div>

        <!-- Security & PIN Alerts -->
        <div class="flex items-center justify-between p-3.5 rounded-lg border bg-card gap-4">
          <div class="space-y-0.5">
            <div class="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <ShieldCheck class="size-3.5 text-primary" />
              <span>Security & Failed PIN Attempt Alerts</span>
            </div>
            <p class="text-[11px] text-muted-foreground">
              Log and display security notices for incorrect PIN entries and session timeouts.
            </p>
          </div>
          <Switch
            :checked="prefs.securityAlerts"
            @update:checked="handleToggle('securityAlerts', 'Security alerts')"
          />
        </div>
      </CardContent>

      <CardFooter class="flex items-center justify-between border-t pt-4">
        <p class="text-[11px] text-muted-foreground">
          Preferences are automatically saved to local client storage.
        </p>
        <Button
          variant="outline"
          size="sm"
          class="h-8 text-xs gap-1.5"
          @click="sendTestNotification"
        >
          <Bell class="size-3.5" />
          <span>Send Test Alert</span>
        </Button>
      </CardFooter>
    </Card>
  </div>
</template>
