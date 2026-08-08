<script setup lang="ts">
import { ref } from "vue"

import AppSidebar from "@/components/AppSidebar.vue"

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

function handleMailboxSelected(email: string) {
  selectedMailbox.value = email
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
        class="bg-background sticky top-0 flex shrink-0 items-center gap-2 border-b p-4"
      >
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
          <div class="flex flex-1 items-center justify-center p-6">
            <div class="text-center">
              <p class="text-sm font-medium">
                {{ selectedMailbox }}
              </p>

              <p class="mt-1 text-sm text-muted-foreground">
                Email content will appear here.
              </p>
            </div>
          </div>

        </div>

      </div>
    </SidebarInset>
  </SidebarProvider>
</template>