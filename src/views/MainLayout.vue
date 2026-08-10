<script setup lang="ts">
import AppSidebar from '@/components/AppSidebar.vue'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { useRouter } from 'vue-router'

const router = useRouter()

function handleMailboxSelected(email: string, resourceId: string, hostingerAccount: 'DMBB' | 'DBB') {
  // If not on dashboard, navigate to dashboard first
  if (router.currentRoute.value.path !== '/dashboard') {
    router.push('/dashboard')
  }
  // Store or emit selected mailbox state if needed
  window.dispatchEvent(
    new CustomEvent('mailbox-selected-event', {
      detail: { email, resourceId, hostingerAccount },
    })
  )
}
</script>

<template>
  <SidebarProvider
    class="h-screen w-screen overflow-hidden bg-background text-foreground"
    :style="{
      '--sidebar-width': '350px',
    }"
  >
    <!-- PERSISTENT SIDEBAR -->
    <AppSidebar @mailbox-selected="handleMailboxSelected" />

    <!-- MAIN ROUTER INSET -->
    <SidebarInset class="flex flex-col h-screen overflow-hidden min-w-0 bg-background">
      <RouterView />
    </SidebarInset>
  </SidebarProvider>
</template>
