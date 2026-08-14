<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { Moon, Sun } from "@lucide/vue"

import MailMessages from "@/components/mail/MailMessages.vue"
import MailInboxEmptyState from '@/components/mail/MailInboxEmptyState.vue'
import { Button } from "@/components/ui/button"
import { useTheme } from "@/composables/useTheme"
import { useMailMessages } from "@/composables/useMailMessages"

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
  activeFolder,
  activeMessage,
  messages,
  pagination,
  messagesLoading,
  messagesError,
  handleMailboxSelected,
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
  }>
  if (customEvent.detail) {
    handleMailboxSelected(
      customEvent.detail.email,
      customEvent.detail.resourceId,
      customEvent.detail.hostingerAccount
    )
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

              <!-- Level 3: Active Folder -->
              <BreadcrumbSeparator class="shrink-0" />
              <BreadcrumbItem :class="activeMessage ? 'shrink-0' : 'truncate'">
                <BreadcrumbPage :class="activeMessage ? '' : 'font-semibold text-foreground'">
                  {{ activeFolder }}
                </BreadcrumbPage>
              </BreadcrumbItem>

              <!-- Level 4: Active Message Subject -->
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
          <!-- Email header -->
          <div class="border-b p-2.5 shrink-0 bg-card/20">
            <div class="flex items-center gap-2.5">
              <div
                class="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold shrink-0"
              >
                <span class="text-xs">
                  {{ selectedMailbox.charAt(0).toUpperCase() }}
                </span>
              </div>

              <div class="min-w-0">
                <h1 class="text-xs font-semibold truncate">
                  {{ selectedMailbox }}
                </h1>

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
