import { cacheService } from './cacheService'
import type { Mailbox } from '@/types/mail'

export interface MailboxQuotaData {
  quotas: Array<{
    resourceName: string
    usage: number
    limit: number
    percentage: number
  }>
  totalUsage: number
  totalLimit: number
  totalPercentage: number
  supported: boolean
}

class MailboxService {
  /**
   * Fetch mailbox list with persistent cache and request deduplication
   */
  public async getMailboxes(forceRefresh = false): Promise<Mailbox[]> {
    const settings = cacheService.getSettings()
    const cacheKey = 'mailboxes_list'

    return cacheService.fetchWithCache<Mailbox[]>(
      cacheKey,
      async () => {
        if (typeof window === 'undefined' || !window.hostinger) {
          return []
        }

        const response = await window.hostinger.getMe()
        if (Array.isArray(response?.data)) {
          return response.data
        } else if (Array.isArray(response)) {
          return response
        }
        return []
      },
      settings.mailboxesTtlMs,
      forceRefresh
    )
  }

  /**
   * Fetch mailbox quota / storage usage with persistent cache
   */
  public async getMailboxQuota(
    mailboxResourceId: string,
    hostingerAccount: 'DMBB' | 'DBB',
    forceRefresh = false
  ): Promise<MailboxQuotaData | null> {
    if (!mailboxResourceId) return null

    const settings = cacheService.getSettings()
    const cacheKey = `quota_${hostingerAccount}_${mailboxResourceId}`

    return cacheService.fetchWithCache<MailboxQuotaData | null>(
      cacheKey,
      async () => {
        if (typeof window === 'undefined' || !window.hostinger) {
          return null
        }

        const response = await window.hostinger.getMailboxQuota(
          mailboxResourceId,
          hostingerAccount
        )

        return response?.data ?? null
      },
      settings.quotaTtlMs,
      forceRefresh
    )
  }

  /**
   * Clear cached mailbox and quota data
   */
  public clearCache(): void {
    cacheService.remove('mailboxes_list')
    cacheService.clearByPrefix('quota_')
  }
}

export const mailboxService = new MailboxService()
