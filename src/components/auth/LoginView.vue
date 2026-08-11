<script setup lang="ts">
import OTPForm from "@/components/blocks/otp-02/components/OTPForm.vue"
</script>

<template>
  <div class="flex min-h-svh w-full">
    <!-- Left side -->
    <div class="flex w-full flex-col items-center justify-center p-6 lg:w-1/2">
      <div class="mb-6">
        <img
          src="@/assets/images/dbblogo.png"
          alt="DBB Logo"
          class="h-auto w-30 object-contain"
        />
      </div>

      <div class="w-full max-w-xs">
        <OTPForm />
      </div>
    </div>

    <!-- Right side -->
    <div class="relative hidden w-1/2 lg:block">
      <img
        src="@/assets/images/man-and-pole.jpg"
        alt="Authentication"
        class="absolute inset-0 h-full w-full object-cover"
      />
    </div>
  </div>
</template>
