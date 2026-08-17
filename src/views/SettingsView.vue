<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  UserRound,
  Shield,
  Palette,
  Bell,
  Sliders,
  CheckCircle2,
  Sun,
  Moon,
  Database,
  ChevronRight,
} from '@lucide/vue'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { SidebarTrigger } from '@/components/ui/sidebar'

import ProfileSection from '@/components/settings/ProfileSection.vue'
import SecuritySection from '@/components/settings/SecuritySection.vue'
import AppearanceSection from '@/components/settings/AppearanceSection.vue'
import NotificationsSection from '@/components/settings/NotificationsSection.vue'
import SystemCacheSection from '@/components/settings/SystemCacheSection.vue'

import { useTheme } from '@/composables/useTheme'

type SettingsTab = 'account' | 'security' | 'appearance' | 'notifications' | 'cache'

const route = useRoute()
const router = useRouter()
const { isDark, toggleTheme } = useTheme()

const activeTab = ref<SettingsTab>('account')
const notificationMessage = ref<string | null>(null)
let toastTimer: any = null

const showToast = (msg: string) => {
  if (toastTimer) clearTimeout(toastTimer)
  notificationMessage.value = msg
  toastTimer = setTimeout(() => {
    notificationMessage.value = null
  }, 4000)
}

const tabs = [
  {
    id: 'account' as const,
    label: 'Account & Profile',
    shortLabel: 'Account',
    icon: UserRound,
    description: 'Personal details, avatar, and linked identities',
  },
  {
    id: 'security' as const,
    label: 'Security & PIN',
    shortLabel: 'Security',
    icon: Shield,
    description: 'Change PIN, password, and session auto-lock',
  },
  {
    id: 'appearance' as const,
    label: 'Appearance & Theme',
    shortLabel: 'Appearance',
    icon: Palette,
    description: 'Light/Dark mode and interface density',
  },
  {
    id: 'notifications' as const,
    label: 'Notification Rules',
    shortLabel: 'Notifications',
    icon: Bell,
    description: 'Alert chimes, high-priority PO notifications, and storage warnings',
  },
  {
    id: 'cache' as const,
    label: 'API Cache & Updates',
    shortLabel: 'System',
    icon: Database,
    description: 'Hostinger API cache management, TTLs, and releases',
  },
]

const currentTabInfo = computed(() => {
  return tabs.find((t) => t.id === activeTab.value) || tabs[0]
})

const selectTab = (tabId: SettingsTab) => {
  activeTab.value = tabId
  router.replace({
    query: { ...route.query, tab: tabId },
  })
}

// Sync with route query param
watch(
  () => route.query.tab,
  (newTab) => {
    if (newTab && typeof newTab === 'string') {
      const valid = tabs.some((t) => t.id === newTab)
      if (valid) {
        activeTab.value = newTab as SettingsTab
      }
    }
  },
  { immediate: true }
)

onMounted(() => {
  if (route.query.tab && typeof route.query.tab === 'string') {
    const valid = tabs.some((t) => t.id === route.query.tab)
    if (valid) {
      activeTab.value = route.query.tab as SettingsTab
    }
  }
})
</script>

<template>
  <div class="flex flex-col h-full overflow-hidden bg-background">
    <!-- Header -->
    <header class="bg-background sticky top-0 flex shrink-0 items-center justify-between gap-2 border-b p-3.5 z-20">
      <div class="flex items-center gap-2 min-w-0">
        <SidebarTrigger class="-ml-1 shrink-0" />
        <Separator orientation="vertical" class="mr-2 shrink-0 data-[orientation=vertical]:h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <span class="text-muted-foreground text-xs font-medium">DBB Mail</span>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <span class="text-muted-foreground text-xs font-medium">Settings</span>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage class="font-semibold text-foreground text-xs">
                {{ currentTabInfo.shortLabel }}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div class="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          class="h-8 gap-1.5 text-xs"
          title="Toggle Dark / Light Theme"
          @click="toggleTheme"
        >
          <Sun v-if="isDark" class="size-3.5 text-amber-400" />
          <Moon v-else class="size-3.5" />
          <span class="hidden sm:inline">{{ isDark ? 'Light' : 'Dark' }}</span>
        </Button>
      </div>
    </header>

    <!-- Main Content Area -->
    <div class="flex-1 overflow-y-auto">
      <div class="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        <!-- Toast Notification Banner -->
        <transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 -translate-y-2"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 -translate-y-2"
        >
          <div
            v-if="notificationMessage"
            class="p-3 px-4 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs font-medium flex items-center justify-between shadow-xs sticky top-2 z-30 backdrop-blur-xs"
          >
            <div class="flex items-center gap-2">
              <CheckCircle2 class="size-4 shrink-0 text-primary" />
              <span>{{ notificationMessage }}</span>
            </div>
            <button
              class="text-xs opacity-70 hover:opacity-100 font-semibold"
              @click="notificationMessage = null"
            >
              Dismiss
            </button>
          </div>
        </transition>

        <!-- Page Title Header -->
        <div class="flex md:hidden gap-1.5 overflow-x-auto pt-4 pb-1 no-scrollbar">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            type="button"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors"
            :class="
              activeTab === tab.id
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            "
            @click="selectTab(tab.id)"
          >
            <component :is="tab.icon" class="size-3.5" />
            <span>{{ tab.shortLabel }}</span>
          </button>
        </div>

        <!-- Desktop Grid Layout: Settings Sidebar Navigation + Main Content Panel -->
        <div class="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          <!-- Left Navigation Sidebar (Desktop) -->
          <aside class="hidden md:block md:col-span-4 lg:col-span-3 space-y-1 sticky top-4">
            <nav class="space-y-1">
              <button
                v-for="tab in tabs"
                :key="tab.id"
                type="button"
                class="w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all group"
                :class="
                  activeTab === tab.id
                    ? 'bg-primary/10 text-primary border border-primary/20 shadow-xs font-medium'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                "
                @click="selectTab(tab.id)"
              >
                <component
                  :is="tab.icon"
                  class="size-4.5 shrink-0 mt-0.5 transition-colors"
                  :class="activeTab === tab.id ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'"
                />
                <div class="flex-1 min-w-0">
                  <div class="text-xs font-semibold leading-none mb-1 flex items-center justify-between">
                    <span>{{ tab.label }}</span>
                    <ChevronRight
                      v-if="activeTab === tab.id"
                      class="size-3.5 text-primary shrink-0"
                    />
                  </div>
                  <div class="text-[11px] opacity-80 line-clamp-1">
                    {{ tab.description }}
                  </div>
                </div>
              </button>
            </nav>

            <div class="pt-4 px-3 text-[11px] text-muted-foreground space-y-1">
              <div class="flex items-center justify-between">
                <span>App Version:</span>
                <span class="font-mono font-medium text-foreground">v0.0.3</span>
              </div>
              <div class="flex items-center justify-between">
                <span>Security Engine:</span>
                <span class="font-medium text-emerald-600 dark:text-emerald-400">PIN Protected</span>
              </div>
            </div>
          </aside>

          <!-- Main Content Section -->
          <main class="md:col-span-8 lg:col-span-9 min-w-0">
            <!-- Profile / Account Tab -->
            <ProfileSection
              v-if="activeTab === 'account'"
              @toast="showToast"
            />

            <!-- Security / PIN Tab -->
            <SecuritySection
              v-else-if="activeTab === 'security'"
              @toast="showToast"
            />

            <!-- Appearance / Theme Tab -->
            <AppearanceSection
              v-else-if="activeTab === 'appearance'"
              @toast="showToast"
            />

            <!-- Notifications Tab -->
            <NotificationsSection
              v-else-if="activeTab === 'notifications'"
              @toast="showToast"
            />

            <!-- Cache & System Tab -->
            <SystemCacheSection
              v-else-if="activeTab === 'cache'"
              @toast="showToast"
            />
          </main>
        </div>
      </div>
    </div>
  </div>
</template>
