export interface CacheEntry<T = any> {
  data: T
  timestamp: number
  expiresAt: number
  version?: string
}

export interface CacheSettings {
  enabled: boolean
  mailboxesTtlMs: number
  quotaTtlMs: number
  messagesTtlMs: number
}

const STORAGE_PREFIX = 'dbb_cache_'
const SETTINGS_KEY = 'dbb_cache_settings'

export const DEFAULT_CACHE_SETTINGS: CacheSettings = {
  enabled: true,
  mailboxesTtlMs: 30 * 60 * 1000, // 30 minutes
  quotaTtlMs: 15 * 60 * 1000,     // 15 minutes
  messagesTtlMs: 10 * 60 * 1000,  // 10 minutes
}

class CacheService {
  private inFlightRequests = new Map<string, Promise<any>>()

  /**
   * Read cache settings from localStorage
   */
  public getSettings(): CacheSettings {
    if (typeof window === 'undefined') return DEFAULT_CACHE_SETTINGS
    try {
      const raw = localStorage.getItem(SETTINGS_KEY)
      if (raw) {
        return { ...DEFAULT_CACHE_SETTINGS, ...JSON.parse(raw) }
      }
    } catch (e) {
      console.warn('[CacheService] Failed to read settings:', e)
    }
    return DEFAULT_CACHE_SETTINGS
  }

  /**
   * Save cache settings
   */
  public saveSettings(settings: Partial<CacheSettings>): CacheSettings {
    const current = this.getSettings()
    const updated = { ...current, ...settings }
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated))
      } catch (e) {
        console.warn('[CacheService] Failed to save settings:', e)
      }
    }
    return updated
  }

  /**
   * Retrieve a cached entry if present (does NOT check expiration automatically)
   */
  public getEntry<T>(key: string): CacheEntry<T> | null {
    if (typeof window === 'undefined') return null
    const storageKey = STORAGE_PREFIX + key
    try {
      const item = localStorage.getItem(storageKey)
      if (!item) return null
      return JSON.parse(item) as CacheEntry<T>
    } catch (e) {
      console.warn(`[CacheService] Error reading cache for "${key}":`, e)
      return null
    }
  }

  /**
   * Retrieve cached data if valid and non-expired
   */
  public get<T>(key: string): T | null {
    const settings = this.getSettings()
    if (!settings.enabled) return null

    const entry = this.getEntry<T>(key)
    if (!entry) return null

    if (this.isExpired(entry)) {
      // Clean up stale entry
      this.remove(key)
      return null
    }

    return entry.data
  }

  /**
   * Check whether a cache entry is expired
   */
  public isExpired(entry: CacheEntry): boolean {
    if (!entry || !entry.expiresAt) return true
    return Date.now() >= entry.expiresAt
  }

  /**
   * Store data in persistent cache
   */
  public set<T>(key: string, data: T, ttlMs: number = 15 * 60 * 1000): CacheEntry<T> {
    const now = Date.now()
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + ttlMs,
      version: '1.0',
    }

    if (typeof window !== 'undefined') {
      const storageKey = STORAGE_PREFIX + key
      try {
        localStorage.setItem(storageKey, JSON.stringify(entry))
      } catch (e) {
        console.warn(`[CacheService] Failed to store cache for "${key}" (Quota exceeded?):`, e)
        // Clean up oldest items if quota exceeded
        this.pruneOldestEntries()
      }
    }

    return entry
  }

  /**
   * Remove a specific key from cache
   */
  public remove(key: string): void {
    if (typeof window === 'undefined') return
    try {
      localStorage.removeItem(STORAGE_PREFIX + key)
    } catch (e) {
      console.warn(`[CacheService] Error removing key "${key}":`, e)
    }
  }

  /**
   * Clear all items matching a prefix
   */
  public clearByPrefix(prefix: string): void {
    if (typeof window === 'undefined') return
    const fullPrefix = STORAGE_PREFIX + prefix
    const keysToRemove: string[] = []

    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && k.startsWith(fullPrefix)) {
        keysToRemove.push(k)
      }
    }

    keysToRemove.forEach((k) => localStorage.removeItem(k))
  }

  /**
   * Clear all application caches
   */
  public clearAll(): void {
    if (typeof window === 'undefined') return
    const keysToRemove: string[] = []

    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && k.startsWith(STORAGE_PREFIX)) {
        keysToRemove.push(k)
      }
    }

    keysToRemove.forEach((k) => localStorage.removeItem(k))
    this.inFlightRequests.clear()
  }

  /**
   * Smart wrapper that checks cache, deduplicates concurrent requests, and fetches fresh data
   */
  public async fetchWithCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlMs?: number,
    forceRefresh = false
  ): Promise<T> {
    const settings = this.getSettings()

    // 1. If cache is enabled & not forcing refresh, attempt reading from cache
    if (settings.enabled && !forceRefresh) {
      const cached = this.get<T>(key)
      if (cached !== null) {
        // Cache hit!
        return cached
      }
    }

    // 2. Check if the exact request is already in-flight (deduplication)
    if (this.inFlightRequests.has(key)) {
      return this.inFlightRequests.get(key) as Promise<T>
    }

    // 3. Initiate request & store promise in inFlightRequests map
    const requestPromise = (async () => {
      try {
        const data = await fetcher()
        if (settings.enabled && data !== undefined && data !== null) {
          const effectiveTtl = ttlMs ?? 15 * 60 * 1000
          this.set(key, data, effectiveTtl)
        }
        return data
      } finally {
        this.inFlightRequests.delete(key)
      }
    })()

    this.inFlightRequests.set(key, requestPromise)
    return requestPromise
  }

  /**
   * Detailed cache diagnostics for Settings View
   */
  public getStats(): {
    totalEntries: number
    validEntries: number
    expiredEntries: number
    totalBytes: number
    formattedSize: string
    entries: Array<{
      key: string
      rawKey: string
      timestamp: number
      expiresAt: number
      isExpired: boolean
      sizeBytes: number
      ttlRemainingMs: number
      preview: string
    }>
  } {
    if (typeof window === 'undefined') {
      return {
        totalEntries: 0,
        validEntries: 0,
        expiredEntries: 0,
        totalBytes: 0,
        formattedSize: '0 B',
        entries: [],
      }
    }

    let totalEntries = 0
    let validEntries = 0
    let expiredEntries = 0
    let totalBytes = 0
    const entriesList: any[] = []

    for (let i = 0; i < localStorage.length; i++) {
      const rawKey = localStorage.key(i)
      if (rawKey && rawKey.startsWith(STORAGE_PREFIX)) {
        totalEntries++
        const itemVal = localStorage.getItem(rawKey) || ''
        const sizeBytes = new Blob([itemVal]).size
        totalBytes += sizeBytes

        const key = rawKey.replace(STORAGE_PREFIX, '')
        try {
          const parsed = JSON.parse(itemVal) as CacheEntry
          const expired = this.isExpired(parsed)
          if (expired) expiredEntries++
          else validEntries++

          const ttlRemainingMs = Math.max(0, (parsed.expiresAt || 0) - Date.now())

          let preview = ''
          if (parsed.data) {
            const jsonStr = JSON.stringify(parsed.data)
            preview = jsonStr.length > 60 ? jsonStr.substring(0, 60) + '...' : jsonStr
          }

          entriesList.push({
            key,
            rawKey,
            timestamp: parsed.timestamp || 0,
            expiresAt: parsed.expiresAt || 0,
            isExpired: expired,
            sizeBytes,
            ttlRemainingMs,
            preview,
          })
        } catch {
          expiredEntries++
        }
      }
    }

    const formatBytes = (bytes: number) => {
      if (bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
    }

    return {
      totalEntries,
      validEntries,
      expiredEntries,
      totalBytes,
      formattedSize: formatBytes(totalBytes),
      entries: entriesList.sort((a, b) => b.timestamp - a.timestamp),
    }
  }

  /**
   * Helper to clear oldest entries when localStorage quota is reached
   */
  private pruneOldestEntries(): void {
    if (typeof window === 'undefined') return
    const stats = this.getStats()
    // Remove expired entries first
    stats.entries
      .filter((e) => e.isExpired)
      .forEach((e) => localStorage.removeItem(e.rawKey))

    // If still many, remove oldest 20%
    const remaining = this.getStats().entries
    if (remaining.length > 5) {
      const toRemove = remaining.slice(-Math.ceil(remaining.length * 0.2))
      toRemove.forEach((e) => localStorage.removeItem(e.rawKey))
    }
  }
}

export const cacheService = new CacheService()
