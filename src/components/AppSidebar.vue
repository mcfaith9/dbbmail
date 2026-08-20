<script setup lang="ts">
import type { SidebarProps } from "@/components/ui/sidebar"
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Mail,
  MailX,
  SearchX,
  FolderOpen,
  FolderGit2,
  Settings,
  RefreshCw,
  Plus,
  Trash2,
  ShieldCheck,
  Globe,
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

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import NavUser from '@/components/NavUser.vue'
import MailboxQuota from '@/components/mail/MailboxQuota.vue'
import AddGmailAccountDialog from '@/components/mail/AddGmailAccountDialog.vue'

import type { Mailbox } from '@/types/mail'
import type { GmailAccount } from '@/types/gmail'
import { mailboxService } from '@/services/mailboxService'
import { gmailService } from '@/services/gmailService'

const route = useRoute()
const router = useRouter()

const isDashboard = computed(() => {
  return route.path === '/dashboard' || route.name === 'dashboard'
})

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
| Hostinger Mailboxes & Gmail Accounts State
|--------------------------------------------------------------------------
*/

const mails = ref<Mailbox[]>([])
const gmailAccounts = ref<GmailAccount[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const mailboxSearchQuery = ref('')
const isAddGmailOpen = ref(false)

const isDisconnectDialogOpen = ref(false)
const gmailAccountToRemove = ref<GmailAccount | null>(null)

// Unread counts mapping: mailboxResourceId / accountId -> unread count
const unreadCounts = ref<Record<string, number>>({
  'mbx_dmbb_admin': 1,
  'mbx_dmbb_sales': 1,
  'mbx_dmbb_billing': 0,
  'mbx_dbb_marclouie': 0,
  'mbx_dbb_support': 0,
  'gmail_acc_primary': 1,
  'gmail_acc_procurement': 1,
})

const selectedMailbox = ref<string | null>(null)
const selectedMailboxResourceId = ref<string | null>(null)
const selectedHostingerAccount = ref<'DMBB' | 'DBB' | null>(null)
const selectedProvider = ref<'hostinger' | 'gmail'>('hostinger')

function handleUnreadUpdate(e: Event) {
  const customEvent = e as CustomEvent<{ mailboxResourceId: string; count: number }>
  if (customEvent.detail?.mailboxResourceId) {
    unreadCounts.value[customEvent.detail.mailboxResourceId] = customEvent.detail.count
  }
}

/*
|--------------------------------------------------------------------------
| Filtered Hostinger Mailboxes & Gmail Accounts
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

const filteredGmailAccounts = computed(() => {
  let result = gmailAccounts.value
  const query = mailboxSearchQuery.value.trim().toLowerCase()

  if (query) {
    result = result.filter(
      (acc) =>
        acc.email.toLowerCase().includes(query) ||
        acc.name.toLowerCase().includes(query)
    )
  }

  return result
})

const totalAccountCount = computed(() => mails.value.length + gmailAccounts.value.length)
const totalFilteredCount = computed(() => filteredMails.value.length + filteredGmailAccounts.value.length)

/*
|--------------------------------------------------------------------------
| Fetch Mailboxes & Gmail Accounts
|--------------------------------------------------------------------------
*/

async function fetchMailboxes(forceRefresh = false) {
  loading.value = true
  error.value = null

  try {
    const list = await mailboxService.getMailboxes(forceRefresh)
    mails.value = list
    gmailAccounts.value = gmailService.getAccounts()
  } catch (err: any) {
    console.error('[Sidebar] Failed to fetch mailboxes:', err)
    error.value = err?.message || 'Failed to load mailboxes.'
    mails.value = []
  } finally {
    loading.value = false
  }
}

function refreshGmailAccounts() {
  gmailAccounts.value = gmailService.getAccounts()
}

/*
|--------------------------------------------------------------------------
| Select Mailbox / Account
|--------------------------------------------------------------------------
*/

function selectMailbox(mail: Mailbox) {
  selectedProvider.value = 'hostinger'
  selectedMailbox.value = mail.address
  selectedMailboxResourceId.value = mail.resourceId
  selectedHostingerAccount.value = mail.hostingerAccount || 'DMBB'

  emit(
    'mailbox-selected',
    mail.address,
    mail.resourceId,
    mail.hostingerAccount || 'DMBB',
    'hostinger'
  )
}

function selectGmailAccount(account: GmailAccount) {
  selectedProvider.value = 'gmail'
  selectedMailbox.value = account.email
  selectedMailboxResourceId.value = account.id
  selectedHostingerAccount.value = null

  emit(
    'mailbox-selected',
    account.email,
    account.id,
    'DMBB',
    'gmail',
    account.id
  )
}

function confirmRemoveGmailAccount(account: GmailAccount) {
  gmailAccountToRemove.value = account
  isDisconnectDialogOpen.value = true
}

function handleRemoveGmailAccount(accountId: string) {
  gmailService.removeAccount(accountId)
  refreshGmailAccounts()

  if (selectedMailboxResourceId.value === accountId) {
    if (mails.value.length > 0) {
      selectMailbox(mails.value[0])
    } else {
      selectedMailbox.value = null
      selectedMailboxResourceId.value = null
    }
  }

  gmailAccountToRemove.value = null
  isDisconnectDialogOpen.value = false
}

function disconnectConfirmed() {
  if (!gmailAccountToRemove.value) return

  handleRemoveGmailAccount(gmailAccountToRemove.value.id)
}

function handleGmailAccountAdded(account: GmailAccount) {
  refreshGmailAccounts()
  selectGmailAccount(account)
  isAddGmailOpen.value = false
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
    hostingerAccount: 'DMBB' | 'DBB',
    provider?: 'hostinger' | 'gmail',
    gmailAccountId?: string
  ): void
}>()

/*
|--------------------------------------------------------------------------
| Initial load & unread listeners
|--------------------------------------------------------------------------
*/

onMounted(() => {
  fetchMailboxes()
  refreshGmailAccounts()
  window.addEventListener('mailbox-unread-update', handleUnreadUpdate)
})

onUnmounted(() => {
  window.removeEventListener('mailbox-unread-update', handleUnreadUpdate)
})
</script>

<template>
  <Sidebar
    class="overflow-hidden *:data-[sidebar=sidebar]:flex-row"
    v-bind="props"
  >
    <!-- This is the first sidebar (Navigation Icons) -->
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
                  <img
                    src="@/assets/images/dbblogo.png"
                    alt="DBB Logo"
                    class="h-auto w-30 object-contain"
                  />
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
                  :tooltip="item.title"
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
        <NavUser :user="{ name: 'Marc Louie', email: 'marclouie@dbb.com', avatar: '' }" />
      </SidebarFooter>
    </Sidebar>

    <!-- Second sidebar (Mailboxes & Providers) -->
    <Sidebar
      v-if="isDashboard"
      collapsible="none"
      class="hidden flex-1 md:flex"
    >
      <SidebarHeader class="gap-3.5 border-b p-4">
        <div class="flex w-full items-center justify-between">
          <div class="text-base font-semibold text-foreground flex items-center gap-2">
            <span>Mailboxes</span>
            <Badge
              v-if="totalAccountCount > 0"
              variant="secondary"
              class="h-5 px-1.5 text-xs font-semibold rounded-md bg-muted text-muted-foreground"
            >
              {{ totalAccountCount }}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              class="h-6 w-6 text-muted-foreground hover:text-foreground"
              title="Force Refresh Mailboxes Cache"
              @click="fetchMailboxes(true)"
            >
              <RefreshCw
                class="size-4"
                :stroke-width="2"
                :class="{ 'animate-spin': loading }"
              />
            </Button>           
          </div>

          <span
            v-if="mailboxSearchQuery"
            class="text-[11px] text-muted-foreground font-medium"
          >
            {{ totalFilteredCount }} of {{ totalAccountCount }}
          </span>
          <span
            v-else-if="totalAccountCount > 0"
            class="text-[11px] text-muted-foreground font-medium"
          >
            {{ totalAccountCount }} accounts
          </span>
        </div>

        <SidebarInput
          v-model="mailboxSearchQuery"
          placeholder="Search accounts & mailboxes..."
        />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup class="px-0">
          <SidebarGroupContent>

            <!-- Skeleton Loading Shimmers -->
            <div
              v-if="loading && totalAccountCount === 0"
              class="p-3 space-y-3"
            >
              <div
                v-for="i in 5"
                :key="i"
                class="flex items-start gap-3 p-2 rounded-lg border border-border/40 bg-card/40"
              >
                <Skeleton class="size-5 rounded-md shrink-0 mt-0.5" />
                <div class="space-y-2 flex-1 min-w-0">
                  <div class="flex items-center justify-between gap-2">
                    <Skeleton class="h-3.5 w-3/4 rounded" />
                    <Skeleton class="h-3.5 w-5 rounded-full" />
                  </div>
                  <Skeleton class="h-1.5 w-full rounded" />
                </div>
              </div>
            </div>

            <!-- Error -->
            <div
              v-else-if="error"
              class="p-4 text-sm text-destructive"
            >
              {{ error }}
            </div>

            <!-- No results -->
            <div
              v-else-if="totalFilteredCount === 0"
              class="p-4 text-sm text-muted-foreground"
            >
              <Empty class="border-0">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <SearchX v-if="mailboxSearchQuery" />
                    <MailX v-else />
                  </EmptyMedia>

                  <EmptyTitle class="text-sm">
                    {{ mailboxSearchQuery ? 'Nothing matched your search' : 'No accounts available' }}
                  </EmptyTitle>

                  <EmptyDescription class="text-xs">
                    {{
                      mailboxSearchQuery
                        ? 'Try another keyword or email address.'
                        : 'Connect a Hostinger mailbox or Gmail account.'
                    }}
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </div>

            <!-- ------------------------------------------------------------- -->
            <!-- HOSTINGER MAILBOXES (Preserved 100%)                          -->
            <!-- ------------------------------------------------------------- -->
            <template
              v-for="(mail, index) in filteredMails"
              :key="mail.resourceId"
            >
              <!-- Account Group Separator -->
              <div
                v-if="
                  index === 0 ||
                  mail.hostingerAccount !== filteredMails[index - 1].hostingerAccount
                "
                class="border-t px-3 py-2 border-t-0 bg-muted/20 flex items-center justify-between"
              >
                <div class="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Globe class="size-3 text-primary/70" />
                  <span>HOSTINGER — {{ mail.hostingerAccount }}</span>
                </div>
              </div>

              <!-- Mailbox Item -->
              <a
                href="#"
                :class="[
                  'flex items-start gap-3 border-b p-3 text-sm last:border-b-0 transition-colors',
                  'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  selectedMailbox === mail.address && selectedProvider === 'hostinger'
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                    : '',
                ]"
                @click.prevent="selectMailbox(mail)"
              >
                <!-- Mail icon -->
                <Mail class="mt-0.5 size-4 shrink-0 text-muted-foreground" />

                <!-- Mailbox content -->
                <div class="min-w-0 flex-1">
                  <!-- Email Header & Unread Badge -->
                  <div class="flex items-center justify-between gap-1.5 mb-1">
                    <span class="truncate text-xs font-medium text-foreground">
                      {{ mail.address }}
                    </span>
                    <Badge
                      v-if="(unreadCounts[mail.resourceId] ?? 0) > 0"
                      variant="secondary"
                      class="h-4 px-1.5 text-[9px] font-bold bg-primary/15 text-primary border-primary/30 shrink-0"
                    >
                      {{ unreadCounts[mail.resourceId] }}
                    </Badge>
                  </div>

                  <!-- Quota Progress -->
                  <MailboxQuota
                    :mailbox-resource-id="mail.resourceId"
                    :hostinger-account="mail.hostingerAccount || 'DMBB'"
                  />
                </div>
              </a>
            </template>

            <!-- ------------------------------------------------------------- -->
            <!-- GMAIL ACCOUNTS (New Feature)                                   -->
            <!-- ------------------------------------------------------------- -->
            <div class="border-t mt-2">
              <!-- Gmail Group Header with Add Account Button -->
              <div class="px-3 py-2.5 bg-muted/20 flex items-center justify-between">
                <div class="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Mail class="size-3 text-red-500" />
                  <span>GMAIL</span>
                  <Badge
                    v-if="gmailAccounts.length > 0"
                    variant="outline"
                    class="h-4 px-1 text-[9px] font-semibold border-muted-foreground/30 text-muted-foreground"
                  >
                    {{ gmailAccounts.length }}
                  </Badge>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  class="h-6 px-1.5 text-[10px] font-medium text-primary hover:bg-primary/10 gap-1"
                  title="Connect another Gmail account"
                  @click="isAddGmailOpen = true"
                >
                  <Plus class="size-3" />
                  <span>Add Account</span>
                </Button>
              </div>

              <!-- Gmail Accounts List -->
              <div v-if="filteredGmailAccounts.length === 0" class="p-3 text-center text-xs text-muted-foreground">
                <button
                  type="button"
                  class="w-full py-2 px-3 text-xs border border-dashed rounded-lg text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors flex items-center justify-center gap-1.5"
                  @click="isAddGmailOpen = true"
                >
                  <Plus class="size-3.5 text-primary" />
                  <span>Connect Gmail Account</span>
                </button>
              </div>

              <template v-else>
                <div
                  v-for="acc in filteredGmailAccounts"
                  :key="acc.id"
                  :class="[
                    'group flex items-start gap-3 border-b p-3 text-sm last:border-b-0 transition-colors cursor-pointer',
                    'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                    selectedMailbox === acc.email && selectedProvider === 'gmail'
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                      : '',
                  ]"
                  @click="selectGmailAccount(acc)"
                >
                  <!-- Gmail Icon or Avatar -->
                  <img
                    v-if="acc.avatarUrl"
                    :src="acc.avatarUrl"
                    :alt="acc.name"
                    class="mt-0.5 size-4 rounded-full object-cover shrink-0 border"
                  />
                  <div v-else class="mt-0.5 size-4 rounded flex items-center justify-center text-red-500 shrink-0">
                    <Mail class="size-4" />
                  </div>

                  <!-- Account Content -->
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center justify-between gap-1.5 mb-0.5">
                      <span class="truncate text-xs font-medium text-foreground">
                        {{ acc.name || acc.email }}
                      </span>

                      <div class="flex items-center gap-1 shrink-0">
                        <Badge
                          v-if="(unreadCounts[acc.id] ?? 0) > 0"
                          variant="secondary"
                          class="h-4 px-1.5 text-[9px] font-bold bg-primary/15 text-primary border-primary/30"
                        >
                          {{ unreadCounts[acc.id] }}
                        </Badge>

                        <!-- Disconnect Action on Hover -->
                        <button
                          type="button"
                          class="opacity-0 group-hover:opacity-100 p-0.5 text-muted-foreground hover:text-destructive transition-opacity"
                          title="Disconnect account"
                          @click.stop="confirmRemoveGmailAccount(acc)"
                        >
                          <Trash2 class="size-3" />
                        </button>
                      </div>
                    </div>

                    <div class="flex items-center justify-between gap-1 text-[11px] text-muted-foreground">
                      <span class="truncate">{{ acc.email }}</span>
                      <span class="text-[9px] px-1 py-0.2 rounded bg-muted/60 text-muted-foreground shrink-0 flex items-center gap-0.5">
                        <ShieldCheck class="size-2.5 text-emerald-500" />
                        Read-Only
                      </span>
                    </div>
                  </div>
                </div>
              </template>
            </div>

          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>

    <!-- Add Gmail Account Dialog -->
    <AddGmailAccountDialog
      v-model:open="isAddGmailOpen"
      @account-added="handleGmailAccountAdded"
      @account-removed="handleRemoveGmailAccount"
    />
  </Sidebar>

  <!-- Disconnect Gmail Confirmation -->
  <AlertDialog v-model:open="isDisconnectDialogOpen">
    <AlertDialogContent class="sm:max-w-[420px]">
      <AlertDialogHeader>
        <AlertDialogTitle class="flex items-center gap-2">
          <Trash2 class="size-4 text-destructive" />
          Disconnect Gmail account?
        </AlertDialogTitle>

        <AlertDialogDescription>
          This will remove
          <span class="font-medium text-foreground">
            {{ gmailAccountToRemove?.email }}
          </span>
          from DBB Mail.

          Your Gmail account itself will not be deleted.
        </AlertDialogDescription>
      </AlertDialogHeader>

      <AlertDialogFooter>
        <AlertDialogCancel>
          Cancel
        </AlertDialogCancel>

        <AlertDialogAction
          class="bg-destructive text-white hover:bg-destructive/90"
          @click="disconnectConfirmed"
        >
          Disconnect
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
