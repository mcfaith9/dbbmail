<script setup lang="ts">
import { ref } from "vue"
import { Moon, Sun } from "@lucide/vue"

import AppSidebar from "@/components/AppSidebar.vue"
import MailMessages from "@/components/mail/MailMessages.vue"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/composables/useTheme"

const { isDark, toggleTheme } = useTheme()

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

const selectedMailbox = ref<string | null>(null)
const selectedMailboxResourceId = ref<string | null>(null)
const activeFolder = ref<string>("Inbox")
const activeMessage = ref<any | null>(null)

const messages = ref<any[]>([])
const pagination = ref({
  page: 1,
  perPage: 10,
  total: 0,
  totalPages: 1,
})
const messagesLoading = ref(false)
const messagesError = ref<string | null>(null)

async function handleMailboxSelected(
  email: string,
  mailboxResourceId: string
) {
  selectedMailbox.value = email
  selectedMailboxResourceId.value = mailboxResourceId
  activeMessage.value = null
  pagination.value.page = 1

  await fetchMessages(mailboxResourceId, 1, pagination.value.perPage, activeFolder.value)
}

function handleFolderSelected(folderTitle: string) {
  activeFolder.value = folderTitle
  activeMessage.value = null
  if (selectedMailboxResourceId.value) {
    pagination.value.page = 1
    fetchMessages(selectedMailboxResourceId.value, 1, pagination.value.perPage, folderTitle)
  }
}

function handleMessageSelected(msg: any | null) {
  activeMessage.value = msg
}

async function fetchMessages(
  mailboxResourceId: string,
  page = pagination.value.page,
  perPage = pagination.value.perPage,
  folderName = activeFolder.value
) {
  messagesLoading.value = true
  messagesError.value = null

  try {
    const folder = folderName.toUpperCase()

    const response =
      await window.hostinger.getMailboxMessages(
        mailboxResourceId,
        folder,
        page,
        perPage
      )

    let list: any[] = []

    if (Array.isArray(response.data)) {
      list = response.data
    } else if (response.data && Array.isArray(response.data.messages)) {
      list = response.data.messages
    } else if (Array.isArray(response.messages)) {
      list = response.messages
    } else if (Array.isArray(response)) {
      list = response
    }

    let pag = {
      page: page,
      perPage: perPage,
      total: list.length,
      totalPages: Math.ceil(list.length / perPage) || 1,
    }

    if (response.pagination) {
      pag = {
        page: Number(response.pagination.page) || page,
        perPage: Number(response.pagination.perPage) || perPage,
        total: Number(response.pagination.total) || list.length,
        totalPages: Number(response.pagination.totalPages) || Math.ceil(list.length / perPage) || 1,
      }
    } else if (response.data?.pagination) {
      pag = {
        page: Number(response.data.pagination.page) || page,
        perPage: Number(response.data.pagination.perPage) || perPage,
        total: Number(response.data.pagination.total) || list.length,
        totalPages: Number(response.data.pagination.totalPages) || Math.ceil(list.length / perPage) || 1,
      }
    }

    messages.value = list
    pagination.value = pag

  } catch (err: any) {
    console.error(
      "MESSAGE FETCH ERROR:",
      err
    )

    messagesError.value =
      err.message ||
      "Failed to load messages"

    messages.value = []
  } finally {
    messagesLoading.value = false
  }
}

function handlePageChange(newPage: number) {
  if (!selectedMailboxResourceId.value) return
  pagination.value.page = newPage
  fetchMessages(selectedMailboxResourceId.value, newPage, pagination.value.perPage)
}

function handlePerPageChange(newPerPage: number) {
  if (!selectedMailboxResourceId.value) return
  pagination.value.perPage = newPerPage
  pagination.value.page = 1
  fetchMessages(selectedMailboxResourceId.value, 1, newPerPage)
}

function handleRefresh() {
  if (!selectedMailboxResourceId.value) return
  fetchMessages(selectedMailboxResourceId.value, pagination.value.page, pagination.value.perPage)
}
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