<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useTheme } from '@/composables/useTheme'
import AppVersion from '@/components/layout/AppVersion.vue'

const { initTheme } = useTheme()

onMounted(() => {
  initTheme()
})

const appVersion = ref('—')

onMounted(async () => {
  try {
    if (window.electronAPI?.getVersion) {
      appVersion.value = await window.electronAPI.getVersion()
    }
  } catch (error) {
    console.error('Failed to get Electron app version:', error)
  }
})
</script>

<template>
  <RouterView />
  <AppVersion :version="appVersion" />
</template>
