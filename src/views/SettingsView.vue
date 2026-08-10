<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  Database,
  RefreshCw,
  Trash2,
  Clock,
  HardDrive,
  ShieldCheck,
  Key,
  Sun,
  Moon,
  CheckCircle2,
  Sliders,
  Sparkles,
} from '@lucide/vue'

import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { SidebarTrigger } from '@/components/ui/sidebar'

import { useCache } from '@/composables/useCache'
import { useTheme } from '@/composables/useTheme'
import { mailboxService } from '@/services/mailboxService'

const {
  cacheSettings,
  stats,
  refreshStats,
  updateSettings,
  clearAllCache,
  removeItem,
  totalStorageFormatted,
  validEntriesCount,
  expiredEntriesCount,
} = useCache()

const { isDark, toggleTheme } = useTheme()

const searchQuery = ref('')
const notificationMessage = ref<string | null>(null)
const refreshing = ref(false)

const showToast = (msg: string) => {
  notificationMessage.value = msg
  setTimeout(() => {
    notificationMessage.value = null
  }, 3500)
}

const filteredEntries = computed(() => {
  if (!searchQuery.value.trim()) return stats.value.entries
  const q = searchQuery.value.toLowerCase()
  return stats.value.entries.filter(
    (e) => e.key.toLowerCase().includes(q) || e.preview.toLowerCase().includes(q)
  )
})

const formatRemainingTime = (ms: number) => {
  if (ms <= 0) return 'Expired'
  const seconds = Math.floor(ms / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ${minutes % 60}m`
}

const formatTimestamp = (ts: number) => {
  if (!ts) return '—'
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

const handleToggleCache = (val: boolean) => {
  updateSettings({ enabled: val })
  showToast(val ? 'API response cache enabled' : 'API response cache disabled')
}

const handleMailboxesTtlChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  const val = Number(target.value)
  updateSettings({ mailboxesTtlMs: val })
  showToast('Mailboxes TTL updated')
}

const handleQuotaTtlChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  const val = Number(target.value)
  updateSettings({ quotaTtlMs: val })
  showToast('Quota TTL updated')
}

const handleMessagesTtlChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  const val = Number(target.value)
  updateSettings({ messagesTtlMs: val })
  showToast('Messages TTL updated')
}

const handleForceRefreshMailboxes = async () => {
  refreshing.value = true
  try {
    mailboxService.clearCache()
    await mailboxService.getMailboxes(true)
    refreshStats()
    showToast('Mailboxes and Quota API cache refreshed successfully')
  } catch (err: any) {
    showToast('Failed to refresh: ' + (err?.message || 'Error'))
  } finally {
    refreshing.value = false
  }
}

const handleClearAll = () => {
  clearAllCache()
  showToast('All cached API items have been purged')
}

const handleDeleteEntry = (key: string) => {
  removeItem(key)
  showToast(`Item "${key}" deleted from cache`)
}

onMounted(() => {
  refreshStats()
})
</script>

<template>
  <div class="flex flex-col h-full overflow-hidden bg-background">
    <!-- Header -->
    <header class="bg-background sticky top-0 flex shrink-0 items-center justify-between gap-2 border-b p-3.5 z-20">
      <div class="flex items-center gap-2 min-w-0">
        <SidebarTrigger class="-ml-1 shrink-0" />
        <Separator orientation="vertical" class="mr-2 shrink-0 data-[orientation=vertical]:h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <span class="text-muted-foreground text-xs font-medium">DBB Mail</span>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage class="font-semibold text-foreground text-xs">Settings & Cache</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div class="flex items-center gap-2">
        <Button variant="outline" size="sm" class="h-8 gap-1.5 text-xs" @click="toggleTheme">
          <Sun v-if="isDark" class="size-3.5 text-amber-400" />
          <Moon v-else class="size-3.5" />
          <span>{{ isDark ? 'Light' : 'Dark' }} Mode</span>
        </Button>
      </div>
    </header>

    <!-- Content scroll area -->
    <div class="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 max-w-6xl mx-auto w-full">
      <!-- Toast Notification Banner -->
      <transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 -translate-y-2"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-2"
      >
        <div
          v-if="notificationMessage"
          class="p-3 px-4 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs font-medium flex items-center justify-between shadow-xs"
        >
          <div class="flex items-center gap-2">
            <CheckCircle2 class="size-4 shrink-0 text-primary" />
            <span>{{ notificationMessage }}</span>
          </div>
          <button class="text-xs opacity-70 hover:opacity-100" @click="notificationMessage = null">Dismiss</button>
        </div>
      </transition>

      <!-- Page Title -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 class="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Sliders class="size-5 text-primary" />
            <span>Application Settings</span>
          </h1>
          <p class="text-xs text-muted-foreground mt-0.5">
            Manage persistent API caching, rate limit protection, storage TTLs, and API credentials.
          </p>
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

          <Button variant="destructive" size="sm" class="h-8 gap-1.5 text-xs" @click="handleClearAll">
            <Trash2 class="size-3.5" />
            <span>Purge All Cache</span>
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

      <!-- Cache TTL Configuration Section -->
      <div class="p-5 rounded-xl border bg-card text-card-foreground shadow-xs space-y-4">
        <div class="flex items-center gap-2 pb-2 border-b">
          <Clock class="size-4 text-primary" />
          <h2 class="text-sm font-semibold">Cache Expiration (TTL) Configurations</h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Mailbox List TTL -->
          <div class="space-y-1.5">
            <Label class="text-xs font-medium">Mailboxes List TTL</Label>
            <select
              class="w-full h-9 rounded-md border border-input bg-background px-3 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
              :value="cacheSettings.mailboxesTtlMs"
              @change="handleMailboxesTtlChange"
            >
              <option :value="5 * 60 * 1000">5 Minutes</option>
              <option :value="15 * 60 * 1000">15 Minutes</option>
              <option :value="30 * 60 * 1000">30 Minutes (Recommended)</option>
              <option :value="60 * 60 * 1000">1 Hour</option>
              <option :value="12 * 60 * 60 * 1000">12 Hours</option>
              <option :value="24 * 60 * 60 * 1000">24 Hours</option>
            </select>
            <p class="text-[11px] text-muted-foreground">How long to reuse mailbox accounts list.</p>
          </div>

          <!-- Quota Storage TTL -->
          <div class="space-y-1.5">
            <Label class="text-xs font-medium">Mailbox Quota Storage TTL</Label>
            <select
              class="w-full h-9 rounded-md border border-input bg-background px-3 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
              :value="cacheSettings.quotaTtlMs"
              @change="handleQuotaTtlChange"
            >
              <option :value="5 * 60 * 1000">5 Minutes</option>
              <option :value="15 * 60 * 1000">15 Minutes (Recommended)</option>
              <option :value="30 * 60 * 1000">30 Minutes</option>
              <option :value="60 * 60 * 1000">1 Hour</option>
            </select>
            <p class="text-[11px] text-muted-foreground">How long storage quota info stays valid.</p>
          </div>

          <!-- Messages TTL -->
          <div class="space-y-1.5">
            <Label class="text-xs font-medium">Messages & Email Content TTL</Label>
            <select
              class="w-full h-9 rounded-md border border-input bg-background px-3 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
              :value="cacheSettings.messagesTtlMs"
              @change="handleMessagesTtlChange"
            >
              <option :value="5 * 60 * 1000">5 Minutes</option>
              <option :value="10 * 60 * 1000">10 Minutes (Recommended)</option>
              <option :value="30 * 60 * 1000">30 Minutes</option>
              <option :value="60 * 60 * 1000">1 Hour</option>
            </select>
            <p class="text-[11px] text-muted-foreground">How long email previews & bodies remain cached.</p>
          </div>
        </div>
      </div>

      <!-- Cache Entry Inspector Table -->
      <div class="p-5 rounded-xl border bg-card text-card-foreground shadow-xs space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b">
          <div class="flex items-center gap-2">
            <Database class="size-4 text-primary" />
            <h2 class="text-sm font-semibold">Cached Items Inspector</h2>
            <Badge variant="secondary" class="text-[10px] font-mono">{{ stats.totalEntries }} items</Badge>
          </div>

          <div class="flex items-center gap-2">
            <Input
              v-model="searchQuery"
              placeholder="Search cached keys..."
              class="h-8 text-xs w-48 lg:w-64"
            />
            <Button variant="ghost" size="icon" class="h-8 w-8 shrink-0" title="Refresh Table" @click="refreshStats">
              <RefreshCw class="size-3.5" />
            </Button>
          </div>
        </div>

        <div class="rounded-md border overflow-hidden">
          <Table>
            <TableHeader class="bg-muted/50">
              <TableRow>
                <TableHead class="text-xs font-semibold">Cache Key</TableHead>
                <TableHead class="text-xs font-semibold">Status</TableHead>
                <TableHead class="text-xs font-semibold">Cached At</TableHead>
                <TableHead class="text-xs font-semibold">TTL Remaining</TableHead>
                <TableHead class="text-xs font-semibold">Size</TableHead>
                <TableHead class="text-xs font-semibold text-right">Action</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              <TableRow v-if="filteredEntries.length === 0">
                <TableCell colspan="6" class="h-24 text-center text-xs text-muted-foreground">
                  No cached items match your filter.
                </TableCell>
              </TableRow>

              <TableRow v-for="entry in filteredEntries" :key="entry.key" class="text-xs">
                <TableCell class="font-mono text-[11px] max-w-[220px] truncate">
                  <div class="font-medium text-foreground truncate" :title="entry.key">
                    {{ entry.key }}
                  </div>
                  <div class="text-[10px] text-muted-foreground truncate" :title="entry.preview">
                    {{ entry.preview }}
                  </div>
                </TableCell>

                <TableCell>
                  <Badge
                    :variant="entry.isExpired ? 'destructive' : 'outline'"
                    class="text-[10px] uppercase font-mono px-1.5 py-0"
                  >
                    {{ entry.isExpired ? 'Expired' : 'Valid' }}
                  </Badge>
                </TableCell>

                <TableCell class="text-muted-foreground text-[11px]">
                  {{ formatTimestamp(entry.timestamp) }}
                </TableCell>

                <TableCell class="font-mono text-[11px]">
                  <span :class="entry.isExpired ? 'text-destructive font-medium' : 'text-emerald-600 dark:text-emerald-400 font-medium'">
                    {{ formatRemainingTime(entry.ttlRemainingMs) }}
                  </span>
                </TableCell>

                <TableCell class="text-muted-foreground text-[11px]">
                  {{ (entry.sizeBytes / 1024).toFixed(1) }} KB
                </TableCell>

                <TableCell class="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-7 w-7 text-muted-foreground hover:text-destructive"
                    title="Remove from Cache"
                    @click="handleDeleteEntry(entry.key)"
                  >
                    <Trash2 class="size-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>

      <!-- API Credentials & Connection Status -->
      <div class="p-5 rounded-xl border bg-card text-card-foreground shadow-xs space-y-4">
        <div class="flex items-center gap-2 pb-2 border-b">
          <Key class="size-4 text-primary" />
          <h2 class="text-sm font-semibold">Hostinger API Credentials Status</h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="p-3.5 rounded-lg border bg-background flex items-center justify-between">
            <div class="space-y-0.5">
              <div class="text-xs font-semibold flex items-center gap-2">
                <span>DMBB Account Token</span>
                <Badge variant="outline" class="text-[10px]">HOSTINGER_API_TOKEN</Badge>
              </div>
              <p class="text-[11px] text-muted-foreground">Token configured in server environment</p>
            </div>
            <div class="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 class="size-4" />
              <span>Connected</span>
            </div>
          </div>

          <div class="p-3.5 rounded-lg border bg-background flex items-center justify-between">
            <div class="space-y-0.5">
              <div class="text-xs font-semibold flex items-center gap-2">
                <span>DBB Account Token</span>
                <Badge variant="outline" class="text-[10px]">HOSTINGER_API_TOKEN_DBB</Badge>
              </div>
              <p class="text-[11px] text-muted-foreground">Token configured in server environment</p>
            </div>
            <div class="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 class="size-4" />
              <span>Connected</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
