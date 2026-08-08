<script setup lang="ts">
import type { SidebarProps } from '@/components/ui/sidebar'
import { ArchiveX, Command, File, Inbox, Send, Trash2, Mail } from "@lucide/vue"
import { ref, onMounted, h } from 'vue'
import NavUser from '@/components/NavUser.vue'
import { Label } from '@/components/ui/label'
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
  useSidebar,
} from '@/components/ui/sidebar'
import { Switch } from '@/components/ui/switch'

const props = withDefaults(defineProps<SidebarProps>(), {
  collapsible: "icon",
})

const emit = defineEmits<{
  mailboxSelected: [
    email: string,
    mailboxResourceId: string
  ]
}>()

function selectMailbox(mail: {
  email: string
  mailboxResourceId: string
}) {
  selectedMailbox.value = mail.email

  emit(
    "mailboxSelected",
    mail.email,
    mail.mailboxResourceId
  )
}

// This is sample data
const data = {
  user: {
    name: "DBB Admin",
    email: "admin@dbb.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Inbox",
      url: "#",
      icon: Inbox,
      isActive: true,
    },
    {
      title: "Drafts",
      url: "#",
      icon: File,
      isActive: false,
    },
    {
      title: "Sent",
      url: "#",
      icon: Send,
      isActive: false,
    },
    {
      title: "Junk",
      url: "#",
      icon: ArchiveX,
      isActive: false,
    },
    {
      title: "Trash",
      url: "#",
      icon: Trash2,
      isActive: false,
    },
  ],
}

const loading = ref(false)
const error = ref<string | null>(null)
const selectedMailbox = ref<string | null>(null)
const mailboxes = ref<
  {
    resourceId: string
    address: string
  }[]
>([])

const mails = ref<
  {
    email: string
    name: string
    mailboxResourceId: string
    subject: string
    teaser: string
    date: string
  }[]
>([])

// Currently selected first-sidebar item
const activeItem = ref(data.navMain[0])

// Open second sidebar
const open = ref(false)

function setOpen(value: boolean) {
  open.value = value
}

async function getHostingerData() {
  loading.value = true
  error.value = null

  try {
    const response = await window.hostinger.getMe()

    // Get the mailboxes from Hostinger
    mailboxes.value = response.data?.mailboxes || []

    // Convert Hostinger mailboxes into the format
    // your second sidebar already uses
    mails.value = mailboxes.value.map((mailbox) => ({
      email: mailbox.address,
      name: mailbox.address,
      mailboxResourceId: mailbox.resourceId,
      subject: '',
      teaser: '',
      date: '',
    }))

    // Automatically open the second sidebar
    if (mails.value.length > 0) {
      setOpen(true)
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to load mailboxes'
    console.error('Hostinger error:', err)
  } finally {
    loading.value = false
  }
}

console.log("MAILBOXES:", mails.value)

onMounted(() => {
  getHostingerData()
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
                  <span class="truncate font-medium">Acme Inc</span>
                  <span class="truncate text-xs">Enterprise</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent class="px-1.5 md:px-0">
            <SidebarMenu>
              <SidebarMenuItem
                v-for="item in data.navMain"
                :key="item.title"
              >
                <SidebarMenuButton
                  :tooltip="h('div', { hidden: false }, item.title)"
                  :is-active="activeItem.title === item.title"
                  class="px-2.5 md:px-2"
                  @click="
                    () => {
                      activeItem = item
                      setOpen(true)
                    }
                  "
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
        <NavUser :user="data.user" />
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
          <div class="text-base font-medium text-foreground">
            {{ activeItem.title }}
          </div>

          <Label class="flex items-center gap-2 text-sm">
            <span>Unreads</span>
            <Switch class="shadow-none" />
          </Label>
        </div>

        <SidebarInput placeholder="Type to search..." />
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
              v-else-if="mails.length === 0"
              class="p-4 text-sm text-muted-foreground"
            >
              No mailboxes found.
            </div>

            <!-- Mailboxes -->
            <a
              v-for="mail in mails"
              :key="mail.mailboxResourceId"
              href="#"
              :class="[
                'flex items-center gap-3 border-b p-3 text-sm last:border-b-0',
                'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                selectedMailbox === mail.email
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : ''
              ]"
              @click.prevent="selectMailbox(mail)"
            >
              <Mail class="size-4 shrink-0" />

              <span class="truncate text-sm">
                {{ mail.email }}
              </span>
            </a>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  </Sidebar>
</template>
