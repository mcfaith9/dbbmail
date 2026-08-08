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
const { login } = useAuth()

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
        <div class="flex flex-col items-center gap-1 text-center">
          <h1 class="text-2xl font-bold">
            Welcome back
          </h1>

          <p class="text-muted-foreground text-sm text-balance">
            Enter your 6-digit PIN to continue.
          </p>
        </div>

        <!-- PIN -->
        <Field>
          <FieldLabel for="pin" class="sr-only">
            PIN
          </FieldLabel>

          <InputOTP
            id="pin"
            v-model="pin"
            :maxlength="6"
            :disabled="isLoading"
            inputmode="numeric"
            pattern="[0-9]*"
            required
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

          <FieldDescription class="text-center">
            Enter your 6-digit PIN.
          </FieldDescription>

          <!-- Error -->
          <p
            v-if="error"
            class="text-destructive text-center text-sm"
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
          {{ isLoading ? 'Unlocking...' : 'Unlock' }}
        </Button>

      </FieldGroup>
    </form>
  </div>
</template>