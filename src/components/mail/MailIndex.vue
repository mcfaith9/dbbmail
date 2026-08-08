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
  console.log("EMAIL:", email)
  console.log("RESOURCE ID:", mailboxResourceId)

  selectedMailbox.value = email
  selectedMailboxResourceId.value = mailboxResourceId
  pagination.value.page = 1

  await fetchMessages(mailboxResourceId, 1, pagination.value.perPage)
}

async function fetchMessages(
  mailboxResourceId: string,
  page = pagination.value.page,
  perPage = pagination.value.perPage
) {
  messagesLoading.value = true
  messagesError.value = null

  try {
    const folder = "INBOX"

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
    :style="{
      '--sidebar-width': '350px',
    }"
  >
    <!-- LEFT SIDEBAR + SECOND SIDEBAR -->
    <AppSidebar
      @mailbox-selected="handleMailboxSelected"
    />

    <!-- MAIN CONTENT -->
    <SidebarInset>
      <header
        class="bg-background sticky top-0 flex shrink-0 items-center justify-between gap-2 border-b p-4 z-20"
      >
        <div class="flex items-center gap-2">
          <SidebarTrigger class="-ml-1" />

          <Separator
            orientation="vertical"
            class="mr-2 data-[orientation=vertical]:h-4"
          />

          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem class="hidden md:block">
                <BreadcrumbLink href="#">
                  All Mailboxes
                </BreadcrumbLink>
              </BreadcrumbItem>

              <BreadcrumbSeparator class="hidden md:block" />

              <BreadcrumbItem>
                <BreadcrumbPage>
                  Inbox
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <Button
          variant="outline"
          size="sm"
          class="h-8 px-2.5 text-xs gap-1.5"
          @click="toggleTheme"
        >
          <Sun v-if="isDark" class="h-3.5 w-3.5 text-amber-400" />
          <Moon v-else class="h-3.5 w-3.5" />
        </Button>
      </header>

      <!-- EMAIL CONTENT -->
      <div class="flex flex-1 flex-col">

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
          class="flex flex-1 flex-col"
        >
          <!-- Email header -->
          <div class="border-b p-2">
            <div class="flex items-center gap-2">
              <div
                class="flex size-8 items-center justify-center rounded-full bg-muted"
              >
                <span class="text-sm font-medium">
                  {{ selectedMailbox.charAt(0).toUpperCase() }}
                </span>
              </div>

              <div>
                <h1 class="text-sm font-semibold">
                  {{ selectedMailbox }}
                </h1>

                <p class="text-sm text-muted-foreground">
                  Inbox
                </p>
              </div>
            </div>
          </div>

          <!-- Email body/content -->
          <div class="flex flex-1 overflow-hidden">
            <MailMessages
              :messages="messages"
              :pagination="pagination"
              :loading="messagesLoading"
              :error="messagesError"
              @page-change="handlePageChange"
              @per-page-change="handlePerPageChange"
              @refresh="handleRefresh"
            />
          </div>
        </div>
      </div>
    </SidebarInset>
  </SidebarProvider>
</template>