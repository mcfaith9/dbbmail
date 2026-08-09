<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { HardDrive, Loader2 } from '@lucide/vue'

interface Quota {
  resourceName: string
  usage: number
  limit: number
  percentage: number
}

interface QuotaData {
  quotas: Quota[]
  totalUsage: number
  totalLimit: number
  totalPercentage: number
  supported: boolean
}

const props = defineProps<{
  mailboxResourceId: string
  hostingerAccount: 'DMBB' | 'DBB'
}>()

const quota = ref<QuotaData | null>(null)
const loading = ref(false)
const error = ref(false)

const storageQuota = computed(() =>
  quota.value?.quotas.find(
    item => item.resourceName === 'STORAGE',
  ),
)

const storagePercentage = computed(() => {
  if (!storageQuota.value) return 0

  return Math.min(
    Math.max(storageQuota.value.percentage, 0),
    100,
  )
})

const messageQuota = computed(() =>
  quota.value?.quotas.find(
    item => item.resourceName === 'MESSAGE',
  ),
)

function formatStorage(bytes: number) {
  if (bytes === 0) return '0 B'

  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const index = Math.floor(Math.log(bytes) / Math.log(1000))

  return `${(bytes / Math.pow(1000, index)).toFixed(2)} ${units[index]}`
}

async function fetchQuota() {
  if (!props.mailboxResourceId) return

  loading.value = true
  error.value = false

  try {
    const response = await window.hostinger.getMailboxQuota(
      props.mailboxResourceId,
      props.hostingerAccount,
    )

    quota.value = response?.data ?? null
  } catch (err) {
    console.error(
      '[MailboxQuota] Failed to fetch quota:',
      err,
    )

    quota.value = null
    error.value = true
  } finally {
    loading.value = false
  }
}

watch(
  [
    () => props.mailboxResourceId,
    () => props.hostingerAccount,
  ],
  fetchQuota,
)

onMounted(fetchQuota)
</script>

<template>
  <!-- Loading -->
  <div
    v-if="loading"
    class="mt-1.5 flex items-center gap-1.5"
  >
    <Loader2 class="size-3 animate-spin text-muted-foreground" />

    <span class="text-[10px] text-muted-foreground">
      Checking storage...
    </span>
  </div>

  <!-- Unsupported / error -->
  <div
    v-else-if="error || !quota?.supported"
    class="mt-1.5 flex items-center gap-1.5"
  >
    <HardDrive class="size-3 text-muted-foreground/50" />

    <span class="text-[10px] text-muted-foreground">
      Storage unavailable
    </span>
  </div>

  <!-- Storage quota -->
  <div
    v-else-if="storageQuota"
    class="mt-1.5 w-full"
  >
    <!-- Quota information -->
    <div class="flex items-center gap-1.5 text-[10px] leading-none">
      <HardDrive class="size-3 shrink-0 font-medium" />

      <span class="font-medium">
        {{ storagePercentage }}% Used
      </span>

      <span class="text-muted-foreground/50">·</span>

      <span class="font-medium">
        {{ formatStorage(storageQuota.usage) }}
      </span>

      <span class="text-muted-foreground/50">·</span>

      <span class="font-medium">
        {{ messageQuota?.usage ?? 0 }} messages
      </span>
    </div>

    <!-- Progress bar -->
    <div
      class="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-muted"
    >
      <div
        class="h-full rounded-full transition-all duration-300"
        :class="[
          storagePercentage >= 90
            ? 'bg-destructive'
            : storagePercentage >= 75
              ? 'bg-amber-500'
              : 'bg-primary',
        ]"
        :style="{
          width: `${Math.max(storagePercentage, 1)}%`,
        }"
      />
    </div>
  </div>
</template>