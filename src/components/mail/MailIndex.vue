<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { Moon, Sun, ShieldCheck } from "@lucide/vue"

import MailMessages from "@/components/mail/MailMessages.vue"
import MailInboxEmptyState from '@/components/mail/MailInboxEmptyState.vue'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useTheme } from "@/composables/useTheme"
import { useMailMessages } from "@/composables/useMailMessages"
import { gmailService } from "@/services/gmailService"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

const { isDark, toggleTheme } = useTheme()

const {
  selectedMailbox,
  selectedProvider,
  activeFolder,
  activeMessage,
  messages,
  pagination,
  messagesLoading,
  messagesError,
  handleMailboxSelected,
  handleGmailAccountSelected,
  handleMessageSelected,
  handlePageChange,
  handlePerPageChange,
  handleRefresh,
  handleFolderChange,
} = useMailMessages()

const handleCustomMailboxSelected = (e: Event) => {
  const customEvent = e as CustomEvent<{
    email: string
    resourceId: string
    hostingerAccount: 'DMBB' | 'DBB'
    provider?: 'hostinger' | 'gmail'
    gmailAccountId?: string
  }>
  if (customEvent.detail) {
    if (customEvent.detail.provider === 'gmail') {
      const accId = customEvent.detail.resourceId || customEvent.detail.gmailAccountId || ''
      const existing = accId ? gmailService.getAccount(accId) : undefined
      if (existing) {
        handleGmailAccountSelected(existing)
      } else {
        const matchingByEmail = gmailService.getAccounts().find(
          (a) => a.email.toLowerCase() === customEvent.detail.email.toLowerCase()
        )
        if (matchingByEmail) {
          handleGmailAccountSelected(matchingByEmail)
        } else {
          console.warn('[MailIndex] Gmail account not found for ID:', accId, customEvent.detail.email)
        }
      }
    } else {
      handleMailboxSelected(
        customEvent.detail.email,
        customEvent.detail.resourceId,
        customEvent.detail.hostingerAccount
      )
    }
  }
}

onMounted(() => {
  window.addEventListener('mailbox-selected-event', handleCustomMailboxSelected)
})

onUnmounted(() => {
  window.removeEventListener('mailbox-selected-event', handleCustomMailboxSelected)
})
</script>

<template>
  <div class="flex flex-col h-full overflow-hidden min-w-0 bg-background">
    <header
      class="bg-background sticky top-0 flex shrink-0 items-center justify-between gap-2 border-b p-3.5 z-20"
    >
      <div class="flex items-center gap-2 min-w-0 overflow-hidden">
        <SidebarTrigger class="-ml-1 shrink-0" />

        <Separator
          orientation="vertical"
          class="mr-2 shrink-0 data-[orientation=vertical]:h-4"
        />

        <!-- DYNAMIC BREADCRUMBS -->
        <Breadcrumb class="min-w-0 overflow-hidden">
          <BreadcrumbList class="flex-nowrap truncate">
            <!-- Level 1: Root -->
            <BreadcrumbItem class="shrink-0">
              <BreadcrumbLink
                href="#"
                @click.prevent="activeMessage = null"
                class="hover:text-foreground transition-colors"
              >
                All Mailboxes
              </BreadcrumbLink>
            </BreadcrumbItem>

            <!-- Level 2: Selected Mailbox Account -->
            <template v-if="selectedMailbox">
              <BreadcrumbSeparator class="shrink-0" />
              <BreadcrumbItem class="shrink-0">
                <BreadcrumbLink
                  href="#"
                  @click.prevent="activeMessage = null"
                  class="font-medium hover:text-foreground transition-colors"
                >
                  {{ selectedMailbox }}
                </BreadcrumbLink>
              </BreadcrumbItem>
            </template>

            <BreadcrumbSeparator class="shrink-0" />

            <BreadcrumbItem class="shrink-0">
              <BreadcrumbLink
                v-if="activeFolder !== 'INBOX'"
                href="#"
                @click.prevent="handleFolderChange('INBOX')"
                class="hover:text-foreground transition-colors"
              >
                Inbox
              </BreadcrumbLink>

              <BreadcrumbPage
                v-else
                class="font-semibold text-foreground"
              >
                Inbox
              </BreadcrumbPage>
            </BreadcrumbItem>

            <!-- Level 4: Child Folder -->
            <template v-if="activeFolder !== 'INBOX'">
              <BreadcrumbSeparator class="shrink-0" />

              <BreadcrumbItem class="shrink-0">
                <BreadcrumbPage class="font-semibold text-foreground">
                  {{
                    activeFolder === 'INBOX.Sent'
                      ? 'Sent'
                      : activeFolder === 'INBOX.Junk'
                        ? 'Junk'
                        : activeFolder
                  }}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </template>

            <!-- Level 5: Active Message Subject -->
            <template v-if="activeMessage">
              <BreadcrumbSeparator class="shrink-0" />

              <BreadcrumbItem class="truncate">
                <BreadcrumbPage class="font-semibold text-foreground truncate">
                  {{ activeMessage.subject || '(No Subject)' }}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </template>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <!-- RIGHT SIDE -->
      <div class="ml-auto flex items-center gap-2 shrink-0">
        <!-- Read-Only Badge for Gmail -->
        <Badge
          v-if="selectedProvider === 'gmail'"
          variant="outline"
          class="h-7 px-2 text-[11px] gap-1 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
        >
          <ShieldCheck class="size-3.5" />
          <span>Gmail (Read-Only)</span>
        </Badge>

        <!-- Dark Mode -->
        <Button
          variant="outline"
          size="sm"
          class="h-8 w-8 p-0"
          @click="toggleTheme"
        >
          <Sun
            v-if="isDark"
            class="h-3.5 w-3.5 text-amber-400"
          />
          <Moon
            v-else
            class="h-3.5 w-3.5"
          />
        </Button>
      </div>
    </header>

    <!-- EMAIL CONTENT -->
    <div class="flex flex-1 flex-col overflow-hidden min-h-0">
      <!-- Nothing selected -->
      <div
        v-if="!selectedMailbox"
        class="flex flex-1 items-center justify-center text-sm text-muted-foreground"
      >
        <MailInboxEmptyState />
      </div>

      <!-- Mailbox selected -->
      <div
        v-else
        class="flex flex-1 flex-col overflow-hidden min-h-0"
      >
        <!-- Email header banner -->
        <div class="border-b p-2.5 shrink-0 bg-card/20 flex items-center justify-between">
          <div class="flex items-center gap-2.5 min-w-0">
            <div
              :class="[
                'flex size-8 items-center justify-center rounded-full font-bold shrink-0',
                selectedProvider === 'gmail'
                  ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                  : 'bg-primary/10 text-primary'
              ]"
            >
              <span class="text-xs">
                {{ selectedMailbox.charAt(0).toUpperCase() }}
              </span>
            </div>

            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <h1 class="text-xs font-semibold truncate">
                  {{ selectedMailbox }}
                </h1>
                <Badge
                  v-if="selectedProvider === 'gmail'"
                  class="h-4 px-1 text-[9px] font-medium bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
                >
                  Gmail
                </Badge>
              </div>

              <p class="text-[11px] text-muted-foreground truncate">
                {{ activeFolder }}
              </p>
            </div>
          </div>
        </div>

        <!-- Email body/content -->
        <div class="flex flex-1 overflow-hidden min-h-0">
          <MailMessages
            :messages="messages"
            :pagination="pagination"
            :loading="messagesLoading"
            :error="messagesError"
            :active-folder="activeFolder"
            @page-change="handlePageChange"
            @per-page-change="handlePerPageChange"
            @refresh="handleRefresh"
            @message-selected="handleMessageSelected"
            @folder-change="handleFolderChange"
          />
        </div>
      </div>
    </div>
  </div>
</template>
