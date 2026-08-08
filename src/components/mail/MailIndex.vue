<script setup lang="ts">
import { Moon, Sun } from "@lucide/vue"

import AppSidebar from "@/components/AppSidebar.vue"
import MailMessages from "@/components/mail/MailMessages.vue"
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

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

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
  handleFolderSelected,
  handleMessageSelected,
  handlePageChange,
  handlePerPageChange,
  handleRefresh,
} = useMailMessages()
</script>

<template>
  <SidebarProvider
    class="h-screen w-screen overflow-hidden"
    :style="{
      '--sidebar-width': '350px',
    }"
  >
    <!-- LEFT SIDEBAR + SECOND SIDEBAR -->
    <AppSidebar
      @mailbox-selected="handleMailboxSelected"
      @folder-selected="handleFolderSelected"
    />

    <!-- MAIN CONTENT -->
    <SidebarInset class="flex flex-col h-screen overflow-hidden min-w-0">
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

        <Button
          variant="outline"
          size="sm"
          class="h-8 px-2.5 text-xs gap-1.5 shrink-0"
          @click="toggleTheme"
        >
          <Sun v-if="isDark" class="h-3.5 w-3.5 text-amber-400" />
          <Moon v-else class="h-3.5 w-3.5" />
        </Button>
      </header>

      <!-- EMAIL CONTENT -->
      <div class="flex flex-1 flex-col overflow-hidden min-h-0">

        <!-- Nothing selected -->
        <div
          v-if="!selectedMailbox"
          class="flex flex-1 items-center justify-center text-sm text-muted-foreground"
        >
          Select an email mailbox
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
              @page-change="handlePageChange"
              @per-page-change="handlePerPageChange"
              @refresh="handleRefresh"
              @message-selected="handleMessageSelected"
            />
          </div>
        </div>
      </div>
    </SidebarInset>
  </SidebarProvider>
</template>
