<script setup lang="ts">
import { computed } from "vue"
import { useRouter } from "vue-router"
import {
  UserRound,
  Bell,
  ChevronsUpDown,
  LogOut,
  Moon,
  Sun,
  ShieldUser,
} from "@lucide/vue"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'

import { useAuth } from '@/composables/useAuth'
import { useTheme } from '@/composables/useTheme'
import sunflower from '@/assets/images/sunflower.avif'

const router = useRouter()
const { user: authUser, logout } = useAuth()
const { isDark, toggleTheme } = useTheme()

const props = defineProps<{
  user?: {
    name: string
    email: string
    avatar: string
  }
}>()

const displayName = computed(() => authUser.value?.name || props.user?.name || 'Marc Louie Cabigas')
const displayEmail = computed(() => authUser.value?.email || props.user?.email || 'marclouie@dbb.com')

const { isMobile } = useSidebar()

const navigateTo = (tab?: string) => {
  if (tab) {
    router.push({ name: 'settings', query: { tab } })
  } else {
    router.push({ name: 'settings' })
  }
}
</script>

<template>
  <SidebarMenu>
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <SidebarMenuButton
            size="lg"
            class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground md:h-8 md:p-0"
          >
            <Avatar class="h-8 w-8 rounded-lg">
              <AvatarImage :src="sunflower" class="h-full w-full object-cover" alt="User Avatar" />
              <AvatarFallback class="rounded-lg">
                <ShieldUser />
              </AvatarFallback>
            </Avatar>
            <div class="grid flex-1 text-left text-sm leading-tight">
              <span class="truncate font-medium">{{ displayName }}</span>
              <span class="truncate text-xs text-muted-foreground">{{ displayEmail }}</span>
            </div>
            <ChevronsUpDown class="ml-auto size-4" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          class="w-(--reka-dropdown-menu-trigger-width) min-w-56 rounded-lg"
          :side="isMobile ? 'bottom' : 'right'"
          align="end"
          :side-offset="4"
        >
          <DropdownMenuLabel class="p-0 font-normal">
            <div class="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
              <Avatar class="h-8 w-8 rounded-lg">
                <AvatarImage :src="sunflower" class="h-full w-full object-cover" alt="User Avatar" />
                <AvatarFallback class="rounded-2xl">
                  <ShieldUser />
                </AvatarFallback>
              </Avatar>
              <div class="grid flex-1 text-left text-sm leading-tight">
                <span class="truncate font-medium">{{ displayName }}</span>
                <span class="truncate text-xs text-muted-foreground">{{ displayEmail }}</span>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem @click="toggleTheme">
              <Sun v-if="isDark" class="size-4 text-amber-400" />
              <Moon v-else class="size-4 text-primary" />
              <span>
                {{ isDark ? 'Light Mode' : 'Dark Mode' }}
              </span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem @click="navigateTo('account')">
              <UserRound class="size-4 text-primary" />
              <span>Account</span>
            </DropdownMenuItem>
            <DropdownMenuItem @click="navigateTo('notifications')">
              <Bell class="size-4 text-primary" />
              <span>Notifications</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem @click="logout" class="text-destructive focus:text-destructive">
            <LogOut class="size-4 text-primary" />
            <span>Lock</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  </SidebarMenu>
</template>
