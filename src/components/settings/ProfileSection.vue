<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import {
  Mail,
  ShieldCheck,
  Building2,
  Pencil,
  AlertCircle,
  Camera,
  AtSign,
  Sparkles,
  Server,
  CheckCircle2,
} from '@lucide/vue'

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/composables/useAuth'
import sunflower from '@/assets/images/sunflower.avif'

const emit = defineEmits<{
  (e: 'toast', message: string): void
}>()

const { user, updateUserProfile } = useAuth()

const isEditDialogOpen = ref(false)

const profileForm = reactive({
  name: user.value?.name || 'Marc Louie Cabigas',
  email: user.value?.email || 'info@dmbbcontractor.com',
  role: user.value?.role || 'Systems Administrator',
  status: user.value?.status || 'Active',
})

const isSaving = ref(false)
const formError = ref<string | null>(null)

const initials = computed(() => {
  const name = user.value?.name || 'Marc Louie Cabigas'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()
})

const openEditDialog = () => {
  profileForm.name = user.value?.name || 'Marc Louie Cabigas'
  profileForm.email = user.value?.email || 'info@dmbbcontractor.com'
  profileForm.role = user.value?.role || 'Systems Administrator'
  profileForm.status = user.value?.status || 'Active'
  formError.value = null
  isEditDialogOpen.value = true
}

const saveProfile = async () => {
  if (!profileForm.name.trim()) {
    formError.value = 'Full name is required.'
    return
  }
  if (!profileForm.email.trim() || !profileForm.email.includes('@')) {
    formError.value = 'A valid email address is required.'
    return
  }

  isSaving.value = true
  await new Promise((resolve) => setTimeout(resolve, 300))

  updateUserProfile({
    name: profileForm.name.trim(),
    email: profileForm.email.trim(),
    role: profileForm.role.trim(),
    status: profileForm.status.trim(),
  })

  isSaving.value = false
  isEditDialogOpen.value = false
  emit('toast', 'User profile updated successfully!')
}
</script>

<template>
  <div class="space-y-6">
    <!-- Main Profile Card -->
    <Card class="overflow-hidden border-border shadow-xs">
      <div class="h-28 bg-linear-to-r from-primary/15 via-primary/5 to-accent/20 border-b relative">
        <div class="absolute right-4 top-4 flex items-center gap-2">
          <Badge variant="outline" class="bg-background/80 backdrop-blur-xs text-xs font-medium gap-1.5 py-1 px-2.5">
            <span class="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{{ user?.status || 'Active Session' }}</span>
          </Badge>
        </div>
      </div>

      <CardContent class="relative pt-0 pb-6 px-6">
        <!-- Avatar & Summary Row -->
        <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 mb-6">
          <div class="flex items-end gap-4">
            <div class="relative group">
              <Avatar class="size-24 rounded-2xl border-4 border-card shadow-md">
                <AvatarImage :src="sunflower" class="object-cover" alt="User avatar" />
                <AvatarFallback class="rounded-2xl text-xl font-bold bg-primary text-primary-foreground">
                  {{ initials }}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                class="absolute bottom-0 right-0 p-1.5 rounded-lg bg-primary text-primary-foreground shadow-sm opacity-90 hover:opacity-100 transition-opacity"
                title="Change Avatar"
                @click="openEditDialog"
              >
                <Camera class="size-3.5" />
              </button>
            </div>

            <div class="space-y-1 mb-1">
              <div class="flex items-center gap-2 flex-wrap">
                <h2 class="text-xl font-bold tracking-tight text-foreground">
                  {{ user?.name || 'Marc Louie Cabigas' }}
                </h2>
                <Badge variant="secondary" class="text-xs font-medium">
                  {{ user?.role || 'Systems Administrator' }}
                </Badge>
              </div>
              <p class="text-xs text-muted-foreground flex items-center gap-1.5">
                <Mail class="size-3.5" />
                <span>{{ user?.email || 'info@dmbbcontractor.com' }}</span>
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            class="h-9 gap-1.5 text-xs font-medium self-start sm:self-auto"
            @click="openEditDialog"
          >
            <Pencil class="size-3.5" />
            <span>Edit Profile</span>
          </Button>
        </div>

        <Separator class="my-5" />

        <!-- Account Attributes Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="p-3.5 rounded-lg border bg-muted/30 space-y-1">
            <div class="flex items-center gap-2 text-muted-foreground text-xs">
              <Building2 class="size-3.5" />
              <span>Organization</span>
            </div>
            <p class="text-sm font-semibold text-foreground">DBB Industrial</p>
            <p class="text-[11px] text-muted-foreground">Corporate Enterprise Tenant</p>
          </div>

          <div class="p-3.5 rounded-lg border bg-muted/30 space-y-1">
            <div class="flex items-center gap-2 text-muted-foreground text-xs">
              <ShieldCheck class="size-3.5 text-emerald-500" />
              <span>Authorization Level</span>
            </div>
            <p class="text-sm font-semibold text-foreground">Tier 1 Superuser</p>
            <p class="text-[11px] text-muted-foreground">Full Mailbox & File System Access</p>
          </div>

          <div class="p-3.5 rounded-lg border bg-muted/30 space-y-1">
            <div class="flex items-center gap-2 text-muted-foreground text-xs">
              <Server class="size-3.5 text-primary" />
              <span>Hostinger Mail Link</span>
            </div>
            <p class="text-sm font-semibold text-foreground">Dual Domain Active</p>
            <div class="flex items-center gap-1.5 mt-0.5">
              <Badge variant="outline" class="text-[10px] py-0 px-1.5 font-mono">DMBB</Badge>
              <Badge variant="outline" class="text-[10px] py-0 px-1.5 font-mono">DBB</Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Connected Services & Identity Details -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card class="border-border shadow-xs">
        <CardHeader class="pb-3">
          <CardTitle class="text-sm font-semibold flex items-center gap-2">
            <AtSign class="size-4 text-primary" />
            <span>Primary Mailbox Identities</span>
          </CardTitle>
          <CardDescription class="text-xs">
            Hostinger mail accounts linked to this operator session.
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-2.5">
          <div class="flex items-center justify-between p-2.5 rounded-lg border bg-muted/20 text-xs">
            <div class="space-y-0.5">
              <div class="font-medium text-foreground">info@dmbbcontractor.com</div>
              <div class="text-[11px] text-muted-foreground">Primary administrative routing</div>
            </div>
            <Badge variant="secondary" class="text-[10px]">Default</Badge>
          </div>

          <div class="flex items-center justify-between p-2.5 rounded-lg border bg-muted/20 text-xs">
            <div class="space-y-0.5">
              <div class="font-medium text-foreground">admin@dmbb.com</div>
              <div class="text-[11px] text-muted-foreground">Commercial executive inbox</div>
            </div>
            <Badge variant="outline" class="text-[10px]">Connected</Badge>
          </div>
        </CardContent>
      </Card>

      <Card class="border-border shadow-xs">
        <CardHeader class="pb-3">
          <CardTitle class="text-sm font-semibold flex items-center gap-2">
            <Sparkles class="size-4 text-amber-500" />
            <span>Session Status</span>
          </CardTitle>
          <CardDescription class="text-xs">
            Security and local token storage information.
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-2.5 text-xs">
          <div class="flex items-center justify-between py-1.5 border-b">
            <span class="text-muted-foreground">Session Persistence</span>
            <span class="font-medium text-emerald-600 dark:text-emerald-400">Encrypted LocalStorage</span>
          </div>
          <div class="flex items-center justify-between py-1.5 border-b">
            <span class="text-muted-foreground">Auto-Lock Protection</span>
            <span class="font-medium">Active (PIN Protected)</span>
          </div>
          <div class="flex items-center justify-between py-1.5">
            <span class="text-muted-foreground">Client Architecture</span>
            <span class="font-mono text-[11px]">Vue 3 + Electron Bridge</span>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Edit Profile Dialog -->
    <Dialog :open="isEditDialogOpen" @update:open="isEditDialogOpen = $event">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle class="text-base font-semibold">Edit User Profile</DialogTitle>
          <DialogDescription class="text-xs">
            Update your display name, administrative email, and role information.
          </DialogDescription>
        </DialogHeader>

        <div v-if="formError" class="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
          <AlertCircle class="size-4 shrink-0" />
          <span>{{ formError }}</span>
        </div>

        <div class="space-y-3.5 py-2">
          <div class="space-y-1.5">
            <Label for="edit-name" class="text-xs font-medium">Display Name</Label>
            <Input
              id="edit-name"
              v-model="profileForm.name"
              placeholder="e.g. Marc Louie Cabigas"
            />
          </div>

          <div class="space-y-1.5">
            <Label for="edit-email" class="text-xs font-medium">Email Address</Label>
            <Input
              id="edit-email"
              type="email"
              v-model="profileForm.email"
              placeholder="e.g. info@dmbbcontractor.com"
            />
          </div>

          <div class="space-y-1.5">
            <Label for="edit-role" class="text-xs font-medium">Role / Title</Label>
            <Input
              id="edit-role"
              v-model="profileForm.role"
              placeholder="e.g. Systems Administrator"
            />
          </div>
        </div>

        <DialogFooter class="flex items-center justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            class="h-8.5 text-xs"
            @click="isEditDialogOpen = false"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            class="h-8.5 text-xs px-4"
            :disabled="isSaving"
            @click="saveProfile"
          >
            <CheckCircle2 class="size-3.5 mr-1" />
            <span>{{ isSaving ? 'Saving...' : 'Save Changes' }}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
