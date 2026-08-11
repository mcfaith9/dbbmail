<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Download, RefreshCw, Sparkles, CheckCircle2, ArrowUpCircle } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import type { UpdateStatusData } from '@/types/electron'

const status = ref<'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error' | 'dev'>('idle')
const versionInfo = ref<any>(null)
const percent = ref<number>(0)
const errorMessage = ref<string>('')
const isDismissed = ref<boolean>(false)

let cleanup: (() => void) | null = null

onMounted(() => {
  if (window.electronAPI?.onUpdateStatus) {
    cleanup = window.electronAPI.onUpdateStatus((data: UpdateStatusData) => {
      status.value = data.status
      if (data.info) versionInfo.value = data.info
      if (data.progress) percent.value = Math.round(data.progress.percent)
      if (data.error) errorMessage.value = data.error
      if (data.status === 'available' || data.status === 'downloading' || data.status === 'downloaded') {
        isDismissed.value = false
      }
    })
  }
})

onUnmounted(() => {
  if (cleanup) cleanup()
})

const handleDownload = async () => {
  status.value = 'downloading'
  await window.electronAPI?.downloadUpdate()
}

const handleQuitAndInstall = () => {
  window.electronAPI?.quitAndInstall()
}

const handleDismiss = () => {
  isDismissed.value = true
}
</script>

<template>
  <!-- Floating Update Notification Banner -->
  <div
    v-if="!isDismissed && (status === 'available' || status === 'downloading' || status === 'downloaded' || status === 'checking')"
    class="fixed bottom-4 right-4 z-50 max-w-sm w-full p-4 rounded-xl border bg-card/95 backdrop-blur-md shadow-xl text-card-foreground border-primary/30 transition-all duration-300"
  >
    <div class="flex items-start justify-between gap-3">
      <div class="flex items-center gap-2.5">
        <div class="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
          <RefreshCw v-if="status === 'checking'" class="size-4 animate-spin" />
          <Sparkles v-else-if="status === 'available'" class="size-4 text-amber-500" />
          <Download v-else-if="status === 'downloading'" class="size-4 animate-bounce text-blue-500" />
          <CheckCircle2 v-else-if="status === 'downloaded'" class="size-4 text-emerald-500" />
        </div>
        <div>
          <h4 class="text-xs font-semibold">
            <span v-if="status === 'checking'">Checking for updates...</span>
            <span v-else-if="status === 'available'">Update {{ versionInfo?.version ? `v${versionInfo.version}` : '' }} Available!</span>
            <span v-else-if="status === 'downloading'">Downloading Update ({{ percent }}%)</span>
            <span v-else-if="status === 'downloaded'">Update Ready to Install!</span>
          </h4>
          <p class="text-[11px] text-muted-foreground mt-0.5">
            <span v-if="status === 'checking'">Comparing installed version with latest release.</span>
            <span v-else-if="status === 'available'">A new version of DBB Mail is ready to download.</span>
            <span v-else-if="status === 'downloading'">Downloading package from GitHub Releases.</span>
            <span v-else-if="status === 'downloaded'">Restart the app to finish applying the update.</span>
          </p>
        </div>
      </div>

      <button class="text-xs text-muted-foreground hover:text-foreground p-1" @click="handleDismiss">
        ✕
      </button>
    </div>

    <!-- Progress bar when downloading -->
    <div v-if="status === 'downloading'" class="mt-3 space-y-1">
      <div class="h-1.5 w-full bg-muted rounded-full overflow-hidden">
        <div class="h-full bg-primary transition-all duration-300" :style="{ width: `${percent}%` }" />
      </div>
      <div class="text-[10px] text-right font-mono text-muted-foreground">{{ percent }}%</div>
    </div>

    <!-- Actions -->
    <div v-if="status === 'available' || status === 'downloaded'" class="mt-3 flex items-center justify-end gap-2">
      <Button v-if="status === 'available'" size="sm" class="h-7 text-xs gap-1.5" @click="handleDownload">
        <Download class="size-3" />
        <span>Download Now</span>
      </Button>

      <Button v-if="status === 'downloaded'" size="sm" class="h-7 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white" @click="handleQuitAndInstall">
        <ArrowUpCircle class="size-3" />
        <span>Restart & Update</span>
      </Button>
    </div>
  </div>
</template>
