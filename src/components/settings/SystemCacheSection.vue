<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import {
  Database,
  RefreshCw,
  Trash2,
  Clock,
  HardDrive,
  ShieldCheck,
  Sparkles,
  FolderGit2,
} from '@lucide/vue'

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

import { useCache } from '@/composables/useCache'
import { mailboxService } from '@/services/mailboxService'
import type { UpdateStatusData } from '@/types/electron'

const emit = defineEmits<{
  (e: 'toast', message: string): void
}>()

const {
  cacheSettings,
  stats,
  refreshStats,
  updateSettings,
  clearAllCache,
  totalStorageFormatted,
  validEntriesCount,
  expiredEntriesCount,
} = useCache()

const refreshing = ref(false)

// Updater state
const appVersion = ref('1.0.0')
const updaterStatus = ref<'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error' | 'dev'>('idle')
const updaterProgress = ref(0)
const updaterInfo = ref<any>(null)
const updaterError = ref('')

let updaterCleanup: (() => void) | null = null

const handleCheckForUpdates = async () => {
  updaterStatus.value = 'checking'
  updaterError.value = ''
  try {
    const res = await window.electronAPI?.checkForUpdates()
    if (res?.status === 'dev') {
      updaterStatus.value = 'dev'
      updaterError.value = res.message || 'Auto-updates are disabled in development mode'
    }
  } catch (err: any) {
    updaterStatus.value = 'error'
    updaterError.value = err?.message || 'Failed to check for updates'
  }
}

const handleToggleCache = (val: boolean) => {
  updateSettings({ enabled: val })
  emit('toast', val ? 'API response cache enabled' : 'API response cache disabled')
}

const handleMailboxesTtlChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  const val = Number(target.value)
  updateSettings({ mailboxesTtlMs: val })
  emit('toast', 'Mailboxes TTL updated')
}

const handleQuotaTtlChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  const val = Number(target.value)
  updateSettings({ quotaTtlMs: val })
  emit('toast', 'Quota TTL updated')
}

const handleMessagesTtlChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  const val = Number(target.value)
  updateSettings({ messagesTtlMs: val })
  emit('toast', 'Messages TTL updated')
}

const handleForceRefreshMailboxes = async () => {
  refreshing.value = true
  try {
    mailboxService.clearCache()
    await mailboxService.getMailboxes(true)
    refreshStats()
    emit('toast', 'Mailboxes and Quota API cache refreshed successfully')
  } catch (err: any) {
    emit('toast', 'Failed to refresh: ' + (err?.message || 'Error'))
  } finally {
    refreshing.value = false
  }
}

const handleClearAll = () => {
  clearAllCache()
  emit('toast', 'All cached API items have been purged')
}

onMounted(async () => {
  refreshStats()
  if (window.electronAPI?.getVersion) {
    appVersion.value = await window.electronAPI.getVersion()
  }
  if (window.electronAPI?.onUpdateStatus) {
    updaterCleanup = window.electronAPI.onUpdateStatus((data: UpdateStatusData) => {
      updaterStatus.value = data.status
      if (data.info) updaterInfo.value = data.info
      if (data.progress) updaterProgress.value = Math.round(data.progress.percent)
      if (data.error) updaterError.value = data.error
    })
  }
})

onUnmounted(() => {
  if (updaterCleanup) updaterCleanup()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Action Bar -->
    <div class="flex items-center justify-between gap-4 p-4 rounded-xl border bg-card">
      <div>
        <h3 class="text-sm font-semibold text-foreground">API Caching & Engine Management</h3>
        <p class="text-xs text-muted-foreground">Manage Hostinger API response cache, rate-limit locks, and TTL lifespans.</p>
      </div>
      <div class="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          class="h-8 gap-1.5 text-xs"
          :disabled="refreshing"
          @click="handleForceRefreshMailboxes"
        >
          <RefreshCw class="size-3.5" :class="{ 'animate-spin': refreshing }" />
          <span>Force API Refresh</span>
        </Button>
        <Button
          variant="destructive"
          size="sm"
          class="h-8 gap-1.5 text-xs"
          @click="handleClearAll"
        >
          <Trash2 class="size-3.5" />
          <span>Purge Cache</span>
        </Button>
      </div>
    </div>

    <!-- Cache Stats Summary Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      <div class="p-4 rounded-xl border bg-card text-card-foreground shadow-xs flex flex-col justify-between">
        <div class="flex items-center justify-between text-muted-foreground">
          <span class="text-xs font-medium">Cache Status</span>
          <ShieldCheck class="size-4 text-emerald-500" />
        </div>
        <div class="mt-2 flex items-baseline justify-between">
          <span class="text-lg font-bold">
            {{ cacheSettings.enabled ? 'Active' : 'Disabled' }}
          </span>
          <Switch
            :checked="cacheSettings.enabled"
            class="scale-90"
            @update:checked="handleToggleCache"
          />
        </div>
        <p class="text-[11px] text-muted-foreground mt-1">Prevents Hostinger API rate limits</p>
      </div>

      <div class="p-4 rounded-xl border bg-card text-card-foreground shadow-xs flex flex-col justify-between">
        <div class="flex items-center justify-between text-muted-foreground">
          <span class="text-xs font-medium">Storage Usage</span>
          <HardDrive class="size-4 text-primary" />
        </div>
        <div class="mt-2 text-lg font-bold">
          {{ totalStorageFormatted }}
        </div>
        <p class="text-[11px] text-muted-foreground mt-1">Stored in persistent localStorage</p>
      </div>

      <div class="p-4 rounded-xl border bg-card text-card-foreground shadow-xs flex flex-col justify-between">
        <div class="flex items-center justify-between text-muted-foreground">
          <span class="text-xs font-medium">Active Cached Items</span>
          <Database class="size-4 text-blue-500" />
        </div>
        <div class="mt-2 text-lg font-bold">
          {{ validEntriesCount }} <span class="text-xs font-normal text-muted-foreground">/ {{ stats.totalEntries }} total</span>
        </div>
        <p class="text-[11px] text-muted-foreground mt-1">{{ expiredEntriesCount }} expired items pending cleanup</p>
      </div>

      <div class="p-4 rounded-xl border bg-card text-card-foreground shadow-xs flex flex-col justify-between">
        <div class="flex items-center justify-between text-muted-foreground">
          <span class="text-xs font-medium">Auto Deduplication</span>
          <Sparkles class="size-4 text-amber-500" />
        </div>
        <div class="mt-2 text-lg font-bold text-emerald-600 dark:text-emerald-400">
          Enabled
        </div>
        <p class="text-[11px] text-muted-foreground mt-1">Locks concurrent requests</p>
      </div>
    </div>

    <!-- Software Auto-Updates Card -->
    <Card class="border-border shadow-xs">
      <CardHeader class="pb-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <FolderGit2 class="size-4 text-primary" />
            <CardTitle class="text-sm font-semibold">Software Updates (GitHub Releases)</CardTitle>
            <Badge variant="outline" class="text-[10px] font-mono">v{{ appVersion }}</Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            class="h-8 gap-1.5 text-xs"
            :disabled="updaterStatus === 'checking' || updaterStatus === 'downloading'"
            @click="handleCheckForUpdates"
          >
            <RefreshCw class="size-3.5" :class="{ 'animate-spin': updaterStatus === 'checking' }" />
            <span>Check for Updates</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent class="space-y-3">
        <div class="p-3.5 rounded-lg border bg-muted/20 space-y-2">
          <div class="text-xs font-semibold flex items-center gap-2">
            <span>Installed Application Version:</span>
            <span class="font-mono text-primary font-bold">v{{ appVersion }}</span>
          </div>
          <p class="text-xs text-muted-foreground">
            Auto-update checker connects to repository releases in packaged desktop builds.
          </p>
        </div>
      </CardContent>
    </Card>

    <!-- Cache TTL Settings Card -->
    <Card class="border-border shadow-xs">
      <CardHeader class="pb-3">
        <CardTitle class="text-sm font-semibold flex items-center gap-2">
          <Clock class="size-4 text-primary" />
          <span>Cache Lifespans (Time-to-Live)</span>
        </CardTitle>
        <CardDescription class="text-xs">Configure how long Hostinger API data is retained locally.</CardDescription>
      </CardHeader>
      <CardContent class="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
        <div class="p-3 rounded-lg border bg-muted/20 space-y-2">
          <Label class="text-xs font-semibold">Mailboxes List TTL</Label>
          <select
            class="w-full h-8.5 rounded-md border border-input bg-background px-2.5 py-1 text-xs text-foreground outline-none"
            :value="cacheSettings.mailboxesTtlMs"
            @change="handleMailboxesTtlChange"
          >
            <option :value="1000 * 60 * 5">5 Minutes</option>
            <option :value="1000 * 60 * 15">15 Minutes</option>
            <option :value="1000 * 60 * 30">30 Minutes</option>
            <option :value="1000 * 60 * 60">1 Hour</option>
          </select>
        </div>

        <div class="p-3 rounded-lg border bg-muted/20 space-y-2">
          <Label class="text-xs font-semibold">Quota Stats TTL</Label>
          <select
            class="w-full h-8.5 rounded-md border border-input bg-background px-2.5 py-1 text-xs text-foreground outline-none"
            :value="cacheSettings.quotaTtlMs"
            @change="handleQuotaTtlChange"
          >
            <option :value="1000 * 60 * 2">2 Minutes</option>
            <option :value="1000 * 60 * 5">5 Minutes</option>
            <option :value="1000 * 60 * 15">15 Minutes</option>
          </select>
        </div>

        <div class="p-3 rounded-lg border bg-muted/20 space-y-2">
          <Label class="text-xs font-semibold">Message Content TTL</Label>
          <select
            class="w-full h-8.5 rounded-md border border-input bg-background px-2.5 py-1 text-xs text-foreground outline-none"
            :value="cacheSettings.messagesTtlMs"
            @change="handleMessagesTtlChange"
          >
            <option :value="1000 * 60 * 30">30 Minutes</option>
            <option :value="1000 * 60 * 60 * 2">2 Hours</option>
            <option :value="1000 * 60 * 60 * 24">24 Hours</option>
          </select>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
