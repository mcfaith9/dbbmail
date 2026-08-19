<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import {
  ShieldCheck,
  Plus,
  Trash2,
  Mail,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  User,
  ChevronDown,
  ChevronUp,
} from '@lucide/vue'
import { gmailService } from '@/services/gmailService'
import { signInWithGmailOAuth, DEFAULT_GOOGLE_CLIENT_ID } from '@/services/gmailAuthService'
import type { GmailAccount } from '@/types/gmail'

defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'account-added', account: GmailAccount): void
  (e: 'account-removed', accountId: string): void
}>()

const emailInput = ref('')
const nameInput = ref('')
const tokenInput = ref('')
const customClientId = ref('')
const customClientSecret = ref('')
const errorMessage = ref<string | null>(null)
const successMessage = ref<string | null>(null)
const isOAuthLoading = ref(false)
const isManualSubmitting = ref(false)
const showManualOptions = ref(false)

const accounts = computed(() => gmailService.getAccounts())

function resetForm() {
  emailInput.value = ''
  nameInput.value = ''
  tokenInput.value = ''
  errorMessage.value = null
  successMessage.value = null
}

async function handleGoogleOAuthSignIn() {
  errorMessage.value = null
  successMessage.value = null
  isOAuthLoading.value = true

  try {
    const result = await signInWithGmailOAuth(
      customClientId.value.trim() || undefined,
      customClientSecret.value.trim() || undefined
    )
    successMessage.value = `Successfully connected "${result.account.email}" via Google OAuth 2.0.`
    emit('account-added', result.account)
  } catch (err: any) {
    console.error('OAuth sign in error:', err)
    errorMessage.value = err?.message || 'Failed to authenticate with Google.'
  } finally {
    isOAuthLoading.value = false
  }
}

function handleManualAddAccount() {
  errorMessage.value = null
  successMessage.value = null

  const email = emailInput.value.trim()
  if (!email || !email.includes('@')) {
    errorMessage.value = 'Please provide a valid Gmail email address.'
    return
  }

  isManualSubmitting.value = true

  try {
    const name = nameInput.value.trim() || email.split('@')[0]
    const token = tokenInput.value.trim() || `token_${Date.now()}`

    const newAccount = gmailService.addAccount({
      email,
      name,
      accessToken: token,
    })

    successMessage.value = `Successfully connected "${email}" (Read-Only).`
    emit('account-added', newAccount)
    resetForm()
  } catch (err: any) {
    errorMessage.value = err?.message || 'Failed to register Gmail account.'
  } finally {
    isManualSubmitting.value = false
  }
}

function handleRemoveAccount(accountId: string) {
  gmailService.removeAccount(accountId)
  emit('account-removed', accountId)
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-[540px] max-h-[90vh] overflow-y-auto p-6">
      <DialogHeader class="pb-3 border-b">
        <div class="flex items-center gap-3">
          <div class="p-2.5 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
            <Mail class="size-5" />
          </div>
          <div>
            <DialogTitle class="text-base font-semibold text-foreground">
              Connect Gmail Account
            </DialogTitle>
            <DialogDescription class="text-xs text-muted-foreground mt-0.5">
              Authenticate with Google OAuth 2.0 to monitor your Gmail inbox securely.
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <div class="space-y-5 py-3">
        <!-- Read-Only Scope Security Notice -->
        <div class="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs flex items-start gap-3">
          <ShieldCheck class="size-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div class="space-y-1">
            <p class="font-semibold text-emerald-900 dark:text-emerald-200">
              Strictly Read-Only Access
            </p>
            <p class="text-emerald-700 dark:text-emerald-300/90 leading-relaxed text-[11px]">
              This integration requests only <code class="bg-emerald-500/20 px-1 py-0.5 rounded font-mono text-[10px]">https://www.googleapis.com/auth/gmail.readonly</code>.
              DBB Mail will NEVER send, modify, delete, or re-label your messages.
            </p>
          </div>
        </div>

        <!-- 1-Click Google OAuth 2.0 Sign In Button -->
        <div class="p-4 rounded-xl border bg-card/60 space-y-3">
          <div class="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center justify-between">
            <span>1-Click Google Sign-In</span>
            <span class="text-[10px] font-normal text-emerald-600 dark:text-emerald-400">OAuth 2.0 Verified</span>
          </div>

          <button
            type="button"
            class="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-lg border border-border/80 bg-background hover:bg-muted/70 text-foreground text-xs font-semibold transition-all shadow-2xs hover:shadow-xs active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            :disabled="isOAuthLoading"
            @click="handleGoogleOAuthSignIn"
          >
            <Spinner v-if="isOAuthLoading" class="size-4 text-primary" />
            <svg
              v-else
              class="size-4 shrink-0"
              viewBox="0 0 48 48"
            >
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
            </svg>
            <span>{{ isOAuthLoading ? 'Signing in with Google...' : 'Sign in with Google' }}</span>
          </button>
          <p class="text-[11px] text-muted-foreground text-center">
            Click to open Google's secure account selector and grant read-only inbox viewing.
          </p>
        </div>

        <!-- Feedback messages -->
        <div v-if="errorMessage" class="p-3 rounded-lg bg-destructive/10 text-destructive text-xs space-y-1.5 border border-destructive/20">
          <div class="flex items-center gap-2 font-medium">
            <AlertCircle class="size-4 shrink-0" />
            <span>Authentication Failed</span>
          </div>
          <p class="text-[11px] leading-relaxed pl-6">{{ errorMessage }}</p>
        </div>

        <div v-if="successMessage" class="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2 border border-emerald-500/20">
          <CheckCircle2 class="size-4 shrink-0" />
          <span>{{ successMessage }}</span>
        </div>

        <!-- Manual Credentials / Test Presets Collapsible -->
        <div class="border rounded-xl bg-card/40 overflow-hidden">
          <button
            type="button"
            class="w-full p-3 text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center justify-between transition-colors"
            @click="showManualOptions = !showManualOptions"
          >
            <span class="flex items-center gap-1.5">
              <Sparkles class="size-3.5 text-primary" />
              <span>Advanced OAuth & Credentials Configuration</span>
            </span>
            <ChevronUp v-if="showManualOptions" class="size-3.5" />
            <ChevronDown v-else class="size-3.5" />
          </button>

          <div v-if="showManualOptions" class="p-4 pt-1 space-y-4 border-t bg-card/60">
            <!-- Custom Client ID -->
            <div class="space-y-1.5">
              <div class="flex items-center justify-between">
                <Label class="text-xs font-medium">Google Client ID (Desktop App)</Label>
                <span class="text-[10px] text-muted-foreground">Optional</span>
              </div>
              <Input
                v-model="customClientId"
                type="text"
                :placeholder="DEFAULT_GOOGLE_CLIENT_ID"
                class="h-9 text-[11px] font-mono"
              />
              <p class="text-[10px] text-muted-foreground">
                Leave empty to use default desktop client ID.
              </p>
            </div>

            <!-- Custom Client Secret -->
            <div class="space-y-1.5">
              <div class="flex items-center justify-between">
                <Label class="text-xs font-medium">Google Client Secret</Label>
                <span class="text-[10px] text-muted-foreground">Optional</span>
              </div>
              <Input
                v-model="customClientSecret"
                type="password"
                placeholder="Optional Client Secret for Desktop OAuth client"
                class="h-9 text-[11px] font-mono"
              />
              <p class="text-[10px] text-muted-foreground">
                Only required if your Google Cloud Desktop Client was created with a client secret requirement.
              </p>
            </div>

            <div class="space-y-3 pt-2 border-t">
              <div class="text-xs font-medium text-foreground">Manual Account Entry</div>
              <div class="space-y-1.5">
                <Label class="text-xs font-medium">Gmail Address</Label>
                <Input
                  v-model="emailInput"
                  type="email"
                  placeholder="e.g. marclouie.work@gmail.com"
                  class="h-9 text-xs"
                />
              </div>

              <div class="space-y-1.5">
                <Label class="text-xs font-medium">Display Name / Label</Label>
                <Input
                  v-model="nameInput"
                  type="text"
                  placeholder="e.g. Marc Louie (Work) or DBB Sales"
                  class="h-9 text-xs"
                />
              </div>

              <div class="space-y-1.5">
                <div class="flex items-center justify-between">
                  <Label class="text-xs font-medium">Access Token</Label>
                  <span class="text-[10px] text-muted-foreground">Optional</span>
                </div>
                <Input
                  v-model="tokenInput"
                  type="password"
                  placeholder="OAuth Bearer token or leave blank"
                  class="h-9 text-xs font-mono"
                />
              </div>
            </div>

            <Button
              class="w-full h-9 text-xs font-medium flex items-center justify-center gap-2 mt-2"
              :disabled="isManualSubmitting || !emailInput"
              @click="handleManualAddAccount"
            >
              <Plus class="size-3.5" />
              <span>Connect Manually</span>
            </Button>
          </div>
        </div>

        <!-- Connected Accounts List -->
        <div class="space-y-2">
          <div class="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center justify-between">
            <span>Connected Gmail Accounts</span>
            <span class="text-muted-foreground font-mono text-[11px]">{{ accounts.length }}</span>
          </div>

          <div v-if="accounts.length === 0" class="p-4 text-center text-xs text-muted-foreground border rounded-xl border-dashed">
            No Gmail accounts connected yet. Click "Sign in with Google" above.
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="acc in accounts"
              :key="acc.id"
              class="flex items-center justify-between p-3 rounded-xl border bg-card text-xs"
            >
              <div class="flex items-center gap-3 min-w-0">
                <img
                  v-if="acc.avatarUrl"
                  :src="acc.avatarUrl"
                  :alt="acc.name"
                  class="size-8 rounded-full object-cover shrink-0 border"
                />
                <div v-else class="size-8 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center font-bold text-xs shrink-0">
                  <User class="size-4" />
                </div>
                <div class="min-w-0">
                  <div class="font-medium text-foreground truncate">
                    {{ acc.name }}
                  </div>
                  <div class="text-[11px] text-muted-foreground truncate">
                    {{ acc.email }}
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-2 shrink-0">
                <span class="px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">
                  Read-Only
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  class="size-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  title="Remove account"
                  @click="handleRemoveAccount(acc.id)"
                >
                  <Trash2 class="size-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
