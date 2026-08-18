<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import type { HTMLAttributes } from 'vue'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from '@/components/ui/input-otp'

import { useAuth } from '@/composables/useAuth'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()

const router = useRouter()
const { login, lockReason } = useAuth()

const pin = ref('')
const error = ref('')
const isLoading = ref(false)

async function handleSubmit() {
  error.value = ''

  if (pin.value.length !== 6) {
    error.value = 'Please enter your 6-digit PIN.'
    return
  }

  isLoading.value = true

  const result = login(pin.value)

  if (!result.success) {
    error.value = result.error ?? 'Incorrect PIN.'
    pin.value = ''
    isLoading.value = false
    return
  }

  await router.push('/dashboard')

  isLoading.value = false
}
</script>

<template>
  <div :class="cn('flex flex-col gap-6', props.class)">
    <form @submit.prevent="handleSubmit">
      <FieldGroup>

        <!-- Header -->
        <div class="flex flex-col items-center text-center">
          <h1 class="text-2xl font-bold tracking-tight">
            Welcome back
          </h1>

          <p class="mt-2 text-sm text-muted-foreground">
            Access your DBB Industrial systems.
          </p>

          <div
            v-if="lockReason"
            class="mt-3 px-3 py-1.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-medium"
          >
            {{ lockReason }}
          </div>
        </div>

        <!-- PIN -->
        <Field class="mt-2">
          <FieldLabel
            for="pin"
            class="mb-3 text-center text-sm font-medium"
          >
            Enter your PIN
          </FieldLabel>

          <InputOTP
            id="pin"
            v-model="pin"
            :maxlength="6"
            :disabled="isLoading"
            inputmode="numeric"
            pattern="[0-9]*"
            required
            class="justify-center"
          >
            <InputOTPGroup
              class="gap-2 *:data-[slot=input-otp-slot]:rounded-md *:data-[slot=input-otp-slot]:border"
            >
              <InputOTPSlot :index="0" />
              <InputOTPSlot :index="1" />
            </InputOTPGroup>

            <InputOTPSeparator />

            <InputOTPGroup
              class="gap-2 *:data-[slot=input-otp-slot]:rounded-md *:data-[slot=input-otp-slot]:border"
            >
              <InputOTPSlot :index="2" />
              <InputOTPSlot :index="3" />
            </InputOTPGroup>

            <InputOTPSeparator />

            <InputOTPGroup
              class="gap-2 *:data-[slot=input-otp-slot]:rounded-md *:data-[slot=input-otp-slot]:border"
            >
              <InputOTPSlot :index="4" />
              <InputOTPSlot :index="5" />
            </InputOTPGroup>
          </InputOTP>

          <FieldDescription class="mt-3 text-center text-xs">
            Enter your 6-digit PIN to continue.
          </FieldDescription>

          <!-- Error -->
          <p
            v-if="error"
            class="mt-2 text-center text-sm text-destructive"
          >
            {{ error }}
          </p>
        </Field>

        <!-- Submit -->
        <Button
          type="submit"
          class="w-full"
          :disabled="isLoading || pin.length !== 6"
        >
          {{ isLoading ? 'Verifying...' : 'Access System' }}
        </Button>

        <!-- Footer -->
        <p class="text-center text-xs text-muted-foreground/60">
          DBB Industrial • Internal Use Only
        </p>

      </FieldGroup>
    </form>
  </div>
</template>