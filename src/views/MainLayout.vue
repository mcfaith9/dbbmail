<script setup lang="ts">
import AppSidebar from '@/components/AppSidebar.vue'
import AppUpdater from '@/components/layout/AppUpdater.vue'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()

const isDashboard = computed(() => {
  return route.path === '/dashboard' || route.name === 'dashboard'
})

function handleMailboxSelected(
  email: string,
  resourceId: string,
  hostingerAccount: 'DMBB' | 'DBB',
  provider?: 'hostinger' | 'gmail',
  gmailAccountId?: string
) {
  // If not on dashboard, navigate to dashboard first
  if (router.currentRoute.value.path !== '/dashboard') {
    router.push('/dashboard')
  }
  // Store or emit selected mailbox state
  window.dispatchEvent(
    new CustomEvent('mailbox-selected-event', {
      detail: { email, resourceId, hostingerAccount, provider, gmailAccountId },
    })
  )
}
</script>

<template>
  <SidebarProvider
    class="h-screen w-screen overflow-hidden bg-background text-foreground"
    :style="{
      '--sidebar-width': isDashboard ? '350px' : 'calc(var(--sidebar-width-icon) + 1px)',
    }"
  >
    <!-- PERSISTENT SIDEBAR -->
    <AppSidebar @mailbox-selected="handleMailboxSelected" />

    <!-- MAIN ROUTER INSET -->
    <SidebarInset class="flex flex-col h-screen overflow-hidden min-w-0 bg-background relative">
      <RouterView />
      <AppUpdater />
    </SidebarInset>
  </SidebarProvider>
</template>
