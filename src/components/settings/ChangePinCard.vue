<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import {
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Loader2,
  Lock,
} from '@lucide/vue'

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/composables/useAuth'

const emit = defineEmits<{
  (e: 'success', message: string): void
  (e: 'cancel'): void
}>()

const { changePin } = useAuth()

const form = reactive({
  currentPin: '',
  newPin: '',
  confirmPin: '',
})

const showCurrent = ref(false)
const showNew = ref(false)
const showConfirm = ref(false)

const touched = reactive({
  currentPin: false,
  newPin: false,
  confirmPin: false,
})

const isSubmitting = ref(false)
const serverError = ref<string | null>(null)
const successMessage = ref<string | null>(null)

// Validation logic
const currentPinError = computed(() => {
  if (!touched.currentPin && !form.currentPin) return null
  if (!form.currentPin.trim()) return 'Current PIN is required.'
  if (!/^\d+$/.test(form.currentPin)) return 'PIN must contain digits only.'
  if (form.currentPin.trim().length !== 6) return 'PIN must be exactly 6 digits.'
  return null
})

const newPinError = computed(() => {
  if (!touched.newPin && !form.newPin) return null
  const pin = form.newPin.trim()
  if (!pin) return 'New PIN is required.'
  if (!/^\d+$/.test(pin)) return 'PIN must contain numeric digits only.'
  if (pin.length !== 6) return 'PIN must be exactly 6 digits.'
  if (form.currentPin && pin === form.currentPin) {
    return 'New PIN cannot be the same as your current PIN.'
  }
  return null
})

const confirmPinError = computed(() => {
  if (!touched.confirmPin && !form.confirmPin) return null
  if (!form.confirmPin.trim()) return 'Please confirm your new PIN.'
  if (form.confirmPin.length !== 6) return 'PIN must be exactly 6 digits.'
  if (form.confirmPin !== form.newPin) return 'Confirmation PIN does not match new PIN.'
  return null
})

const isFormValid = computed(() => {
  return (
    form.currentPin.trim().length === 6 &&
    /^\d{6}$/.test(form.currentPin) &&
    form.newPin.trim().length === 6 &&
    /^\d{6}$/.test(form.newPin) &&
    form.newPin !== form.currentPin &&
    form.confirmPin === form.newPin &&
    !currentPinError.value &&
    !newPinError.value &&
    !confirmPinError.value
  )
})

const resetForm = () => {
  form.currentPin = ''
  form.newPin = ''
  form.confirmPin = ''
  touched.currentPin = false
  touched.newPin = false
  touched.confirmPin = false
  serverError.value = null
}

const handleCancel = () => {
  resetForm()
  successMessage.value = null
  emit('cancel')
}

const handleSubmit = async () => {
  touched.currentPin = true
  touched.newPin = true
  touched.confirmPin = true
  serverError.value = null
  successMessage.value = null

  if (!isFormValid.value) return

  isSubmitting.value = true

  // Subtle realistic delay for security hashing & persistence
  await new Promise((resolve) => setTimeout(resolve, 450))

  const result = changePin(form.currentPin, form.newPin)

  isSubmitting.value = false

  if (!result.success) {
    serverError.value = result.error || 'Failed to update PIN.'
  } else {
    successMessage.value = 'Security PIN updated successfully! Use your new PIN for future logins.'
    resetForm()
    emit('success', 'Security PIN updated successfully!')
  }
}
</script>

<template>
  <Card class="border-border shadow-xs">
    <CardHeader class="pb-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <div class="p-2 rounded-lg bg-primary/10 text-primary">
            <KeyRound class="size-5" />
          </div>
          <div>
            <CardTitle class="text-base font-semibold">Change Security PIN</CardTitle>
            <CardDescription class="text-xs">
              Update your application access PIN for locking and authentication.
            </CardDescription>
          </div>
        </div>
        <Badge variant="outline" class="text-[11px] font-medium px-2 py-0.5">
          <Lock class="size-3 mr-1 text-primary" />
          Encrypted
        </Badge>
      </div>
    </CardHeader>

    <CardContent class="space-y-4">
      <!-- Success Message Banner -->
      <transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 -translate-y-1"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="successMessage"
          class="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs flex items-start gap-2.5"
        >
          <CheckCircle2 class="size-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
          <div class="flex-1">
            <p class="font-medium">{{ successMessage }}</p>
          </div>
          <button
            class="text-xs font-semibold hover:opacity-75 text-emerald-700 dark:text-emerald-300"
            @click="successMessage = null"
          >
            Dismiss
          </button>
        </div>
      </transition>

      <!-- Server Error Banner -->
      <transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 -translate-y-1"
        enter-to-class="opacity-100 translate-y-0"
      >
        <div
          v-if="serverError"
          class="p-3.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2.5"
        >
          <AlertCircle class="size-4 shrink-0 mt-0.5" />
          <div class="flex-1">
            <p class="font-medium">{{ serverError }}</p>
          </div>
          <button
            class="text-xs font-semibold hover:opacity-75"
            @click="serverError = null"
          >
            Dismiss
          </button>
        </div>
      </transition>

      <!-- PIN Requirements Box -->
      <div class="rounded-lg bg-muted/50 border p-3 text-xs text-muted-foreground flex items-start gap-2.5">
        <ShieldAlert class="size-4 text-primary shrink-0 mt-0.5" />
        <div class="space-y-0.5">
          <p class="font-medium text-foreground text-xs">PIN Requirements</p>
          <p class="text-[11px] leading-relaxed">
            Your PIN must be <strong>exactly 6 digits</strong> in length (no more, no less) and contain only numeric characters (0–9).
          </p>
        </div>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- Current PIN Field -->
        <div class="space-y-1.5">
          <div class="flex items-center justify-between">
            <Label for="current-pin" class="text-xs font-medium">Current PIN</Label>
            <span v-if="currentPinError" class="text-[11px] text-destructive font-medium">
              {{ currentPinError }}
            </span>
          </div>
          <div class="relative">
            <Input
              id="current-pin"
              :type="showCurrent ? 'text' : 'password'"
              inputmode="numeric"
              placeholder="Enter 6-digit current PIN"
              maxlength="6"
              v-model="form.currentPin"
              :class="{
                'pr-10': true,
                'border-destructive focus-visible:ring-destructive/20': currentPinError,
              }"
              @blur="touched.currentPin = true"
              @input="touched.currentPin = true; serverError = null"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              tabindex="-1"
              class="absolute right-0 top-0 h-full w-9 text-muted-foreground hover:text-foreground"
              :title="showCurrent ? 'Hide PIN' : 'Show PIN'"
              @click="showCurrent = !showCurrent"
            >
              <EyeOff v-if="showCurrent" class="size-4" />
              <Eye v-else class="size-4" />
            </Button>
          </div>
        </div>

        <!-- New PIN Field -->
        <div class="space-y-1.5">
          <div class="flex items-center justify-between">
            <Label for="new-pin" class="text-xs font-medium">New PIN</Label>
            <span v-if="newPinError" class="text-[11px] text-destructive font-medium">
              {{ newPinError }}
            </span>
          </div>
          <div class="relative">
            <Input
              id="new-pin"
              :type="showNew ? 'text' : 'password'"
              inputmode="numeric"
              placeholder="Enter new 6-digit PIN"
              maxlength="6"
              v-model="form.newPin"
              :class="{
                'pr-10': true,
                'border-destructive focus-visible:ring-destructive/20': newPinError,
              }"
              @blur="touched.newPin = true"
              @input="touched.newPin = true; serverError = null"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              tabindex="-1"
              class="absolute right-0 top-0 h-full w-9 text-muted-foreground hover:text-foreground"
              :title="showNew ? 'Hide PIN' : 'Show PIN'"
              @click="showNew = !showNew"
            >
              <EyeOff v-if="showNew" class="size-4" />
              <Eye v-else class="size-4" />
            </Button>
          </div>
        </div>

        <!-- Confirm PIN Field -->
        <div class="space-y-1.5">
          <div class="flex items-center justify-between">
            <Label for="confirm-pin" class="text-xs font-medium">Confirm New PIN</Label>
            <span v-if="confirmPinError" class="text-[11px] text-destructive font-medium">
              {{ confirmPinError }}
            </span>
          </div>
          <div class="relative">
            <Input
              id="confirm-pin"
              :type="showConfirm ? 'text' : 'password'"
              inputmode="numeric"
              placeholder="Re-enter new 6-digit PIN"
              maxlength="6"
              v-model="form.confirmPin"
              :class="{
                'pr-10': true,
                'border-destructive focus-visible:ring-destructive/20': confirmPinError,
              }"
              @blur="touched.confirmPin = true"
              @input="touched.confirmPin = true"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              tabindex="-1"
              class="absolute right-0 top-0 h-full w-9 text-muted-foreground hover:text-foreground"
              :title="showConfirm ? 'Hide PIN' : 'Show PIN'"
              @click="showConfirm = !showConfirm"
            >
              <EyeOff v-if="showConfirm" class="size-4" />
              <Eye v-else class="size-4" />
            </Button>
          </div>
        </div>
      </form>
    </CardContent>

    <CardFooter class="flex items-center justify-end gap-2.5 border-t pt-4">
      <Button
        type="button"
        variant="outline"
        size="sm"
        class="h-8.5 text-xs px-3.5"
        :disabled="isSubmitting"
        @click="handleCancel"
      >
        Cancel
      </Button>

      <Button
        type="button"
        variant="default"
        size="sm"
        class="h-8.5 text-xs px-4 gap-1.5"
        :disabled="!isFormValid || isSubmitting"
        @click="handleSubmit"
      >
        <Loader2 v-if="isSubmitting" class="size-3.5 animate-spin" />
        <KeyRound v-else class="size-3.5" />
        <span>{{ isSubmitting ? 'Updating PIN...' : 'Change PIN' }}</span>
      </Button>
    </CardFooter>
  </Card>
</template>
