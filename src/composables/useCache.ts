import { ref, onMounted, computed } from 'vue'
import { cacheService, type CacheSettings, DEFAULT_CACHE_SETTINGS } from '@/services/cacheService'
import { mailboxService } from '@/services/mailboxService'

export function useCache() {
  const cacheSettings = ref<CacheSettings>({ ...DEFAULT_CACHE_SETTINGS })
  const stats = ref(cacheService.getStats())
  const loading = ref(false)

  const refreshStats = () => {
    stats.value = cacheService.getStats()
  }

  const loadSettings = () => {
    cacheSettings.value = cacheService.getSettings()
  }

  const updateSettings = (newSettings: Partial<CacheSettings>) => {
    cacheSettings.value = cacheService.saveSettings(newSettings)
    refreshStats()
  }

  const clearAllCache = () => {
    cacheService.clearAll()
    refreshStats()
  }

  const clearMailboxesCache = () => {
    mailboxService.clearCache()
    refreshStats()
  }

  const removeItem = (key: string) => {
    cacheService.remove(key)
    refreshStats()
  }

  onMounted(() => {
    loadSettings()
    refreshStats()
  })

  return {
    cacheSettings,
    stats,
    loading,
    refreshStats,
    loadSettings,
    updateSettings,
    clearAllCache,
    clearMailboxesCache,
    removeItem,
    totalStorageFormatted: computed(() => stats.value.formattedSize),
    validEntriesCount: computed(() => stats.value.validEntries),
    expiredEntriesCount: computed(() => stats.value.expiredEntries),
  }
}
