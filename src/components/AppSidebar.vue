<script setup lang="ts">
import type { SidebarProps } from "@/components/ui/sidebar"
import { computed, h, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Command, Mail, MailX, SearchX,
FolderOpen, FolderGit2, Settings, RefreshCw
} from "@lucide/vue"

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import NavUser from '@/components/NavUser.vue'
import MailboxQuota from '@/components/mail/MailboxQuota.vue'

import type { Mailbox } from '@/types/mail'
import { mailboxService } from '@/services/mailboxService'

const route = useRoute()

const props = withDefaults(defineProps<SidebarProps>(), {
  collapsible: "icon",
})
/*
|--------------------------------------------------------------------------
| Navigation
|--------------------------------------------------------------------------
*/

const navMain = [
  {
    title: 'Mailboxes',
    url: '/dashboard',
    icon: FolderOpen,
  },
  {
    title: 'File Manager',
    url: '/file-manager',
    icon: FolderGit2,
  },
  {
    title: 'Settings',
    url: '/settings',
    icon: Settings,
  },
]

function selectNav(item: typeof navMain[number]) {
  if (item.url && item.url !== '#') {
    router.push(item.url)
  }
}

function isNavActive(item: typeof navMain[number]): boolean {
  if (!item.url) return false
  return route.path === item.url || route.path.startsWith(item.url + '/')
}

/*
|--------------------------------------------------------------------------
| Mailboxes
|--------------------------------------------------------------------------
*/

const mails = ref<Mailbox[]>([])

const loading = ref(false)
const error = ref<string | null>(null)

const mailboxSearchQuery = ref('')

const selectedMailbox = ref<string | null>(null)
const selectedMailboxResourceId = ref<string | null>(null)
const selectedHostingerAccount = ref<'DMBB' | 'DBB' | null>(null)

/*
|--------------------------------------------------------------------------
| Unread filter
|--------------------------------------------------------------------------
*/

const showOnlyUnreads = ref(false)

/*
|--------------------------------------------------------------------------
| Filtered mailboxes
|--------------------------------------------------------------------------
*/

const filteredMails = computed(() => {
  let result = mails.value

  const query = mailboxSearchQuery.value.trim().toLowerCase()

  if (query) {
    result = result.filter((mail) =>
      mail.address.toLowerCase().includes(query)
    )
  }

  // Keep accounts grouped together
  return [...result].sort((a, b) => {
    if (a.hostingerAccount === b.hostingerAccount) {
      return a.address.localeCompare(b.address)
    }

    // DMBB first, DBB second
    return a.hostingerAccount === 'DMBB' ? -1 : 1
  })
})

/*
|--------------------------------------------------------------------------
| Fetch mailboxes
|--------------------------------------------------------------------------
*/

async function fetchMailboxes(forceRefresh = false) {
  loading.value = true
  error.value = null

  try {
    const list = await mailboxService.getMailboxes(forceRefresh)
    mails.value = list
  } catch (err: any) {
    console.error('[Sidebar] Failed to fetch mailboxes:', err)
    error.value = err?.message || 'Failed to load mailboxes.'
    mails.value = []
  } finally {
    loading.value = false
  }
}

/*
|--------------------------------------------------------------------------
| Select mailbox
|--------------------------------------------------------------------------
*/

function selectMailbox(mail: Mailbox) {
  selectedMailbox.value = mail.address

  selectedMailboxResourceId.value =
    mail.resourceId

  selectedHostingerAccount.value =
    mail.hostingerAccount

  /*
   * This is where you connect your mailbox
   * selection to your mail message composable.
   *
   * Replace this with your actual handler
   * if it is already available in your component.
   */

  emit(
    'mailbox-selected',
    mail.address,
    mail.resourceId,
    mail.hostingerAccount
  )
}

/*
|--------------------------------------------------------------------------
| Events
|--------------------------------------------------------------------------
*/

const emit = defineEmits<{
  (
    e: 'mailbox-selected',
    email: string,
    mailboxResourceId: string,
    hostingerAccount: 'DMBB' | 'DBB'
  ): void
}>()

/*
|--------------------------------------------------------------------------
| Initial load
|--------------------------------------------------------------------------
*/

onMounted(() => {
  fetchMailboxes()
})
</script>

<template>
  <Sidebar
    class="overflow-hidden *:data-[sidebar=sidebar]:flex-row"
    v-bind="props"
  >
    <!-- This is the first sidebar -->
    <!-- We disable collapsible and adjust width to icon. -->
    <!-- This will make the sidebar appear as icons. -->
    <Sidebar
      collapsible="none"
      class="w-[calc(var(--sidebar-width-icon)+1px)]! border-r"
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" as-child class="md:h-8 md:p-0">
              <a href="#">
                <div class="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Command class="size-4" />
                </div>
                <div class="grid flex-1 text-left text-sm leading-tight">
                  <span class="truncate font-medium">DBB</span>
                  <span class="truncate text-xs">Industrial</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <!-- Sidebar Main -->
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent class="px-1.5 md:px-0">
            <SidebarMenu>
              <SidebarMenuItem
                v-for="item in navMain"
                :key="item.title"
              >
                <SidebarMenuButton
                  :tooltip="h('div', { hidden: false }, item.title)"
                  :is-active="isNavActive(item)"
                  class="px-2.5 md:px-2"
                  @click="selectNav(item)"
                >
                  <component :is="item.icon" />
                  <span>{{ item.title }}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser :user="{ name: 'DBB Admin', email: 'admin@dbb.com', avatar: '' }" />
      </SidebarFooter>
    </Sidebar>

    <!--  This is the second sidebar -->
    <!--  We disable collapsible and let it fill remaining space -->
    <!-- Second sidebar -->
    <Sidebar
      collapsible="none"
      class="hidden flex-1 md:flex"
    >
      <SidebarHeader class="gap-3.5 border-b p-4">
        <div class="flex w-full items-center justify-between">
          <div class="text-base font-semibold text-foreground flex items-center gap-2">
            <span>Mailboxes</span>
            <Button
              variant="ghost"
              size="icon"
              class="h-6 w-6 text-muted-foreground hover:text-foreground"
              title="Force Refresh Mailboxes Cache"
              @click="fetchMailboxes(true)"
            >
              <RefreshCw class="size-3.5" :class="{ 'animate-spin': loading }" />
            </Button>
          </div>

          <Label class="flex items-center gap-2 text-xs cursor-pointer text-muted-foreground">
            <span>Unreads</span>
            <Switch v-model:checked="showOnlyUnreads" class="shadow-none scale-90" />
          </Label>
        </div>

        <SidebarInput
          v-model="mailboxSearchQuery"
          placeholder="Search mailbox accounts..."
        />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup class="px-0">
          <SidebarGroupContent>

            <!-- Loading -->
            <div
              v-if="loading"
              class="p-4 text-sm text-muted-foreground"
            >
              Loading mailboxes...
            </div>

            <!-- Error -->
            <div
              v-else-if="error"
              class="p-4 text-sm text-destructive"
            >
              {{ error }}
            </div>

            <!-- No mailboxes -->
            <div
              v-else-if="filteredMails.length === 0"
              class="p-4 text-sm text-muted-foreground"
            >
              <Empty class="border-0">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <SearchX v-if="mailboxSearchQuery" />
                    <MailX v-else />
                  </EmptyMedia>

                  <EmptyTitle class="text-sm">
                    {{ mailboxSearchQuery ? 'Nothing matched your search' : 'Your mailbox is empty' }}
                  </EmptyTitle>

                  <EmptyDescription class="text-xs">
                    {{
                      mailboxSearchQuery
                        ? 'Try another keyword and let’s take another look.'
                        : 'No email accounts are available right now.'
                    }}
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </div>

            <!-- Mailboxes -->
            <template
              v-for="(mail, index) in filteredMails"
              :key="mail.resourceId"
            >
              <!-- Account Separator -->
              <div
                v-if="
                  index === 0 ||
                  mail.hostingerAccount !== filteredMails[index - 1].hostingerAccount
                "
                class="border-t px-3 py-2 border-t-0"
              >
                <div
                  class="text-md font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  {{ mail.hostingerAccount }}
                </div>
              </div>

              <!-- Mailbox -->
              <a
                href="#"
                :class="[
                  'flex items-start gap-3 border-b p-3 text-sm last:border-b-0 transition-colors',
                  'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  selectedMailbox === mail.address
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                    : '',
                ]"
                @click.prevent="selectMailbox(mail)"
              >
                <!-- Mail icon -->
                <Mail class="mt-0.5 size-4 shrink-0" />

                <!-- Mailbox content -->
                <div class="min-w-0 flex-1">
                  <!-- Email -->
                  <div class="truncate text-xs">
                    {{ mail.address }}
                  </div>

                  <!-- Quota -->
                  <MailboxQuota
                    :mailbox-resource-id="mail.resourceId"
                    :hostinger-account="mail.hostingerAccount"
                  />
                </div>
              </a>
            </template>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  </Sidebar>
</template>
