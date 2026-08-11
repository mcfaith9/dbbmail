<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import {
  Paperclip,
  FileDown,
  Eye,
  FileText,
  Image as ImageIcon,
  FileCode,
  File,
  X,
  ExternalLink,
} from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Attachment, Message } from '@/types/mail'
import { useMailFormatting } from '@/composables/useMailFormatting'

const props = defineProps<{
  attachments: Attachment[]
  message?: Message | null
}>()

const { formatFileSize } = useMailFormatting()

const loadingId = ref<string | null>(null)
const errorMsg = ref<string | null>(null)

const isPreviewOpen = ref(false)
const previewAttachmentItem = ref<Attachment | null>(null)
const previewUrl = ref<string | null>(null)
const previewText = ref<string | null>(null)
const previewType = ref<'image' | 'pdf' | 'text' | 'other'>('other')

function getFileType(att: Attachment): 'image' | 'pdf' | 'text' | 'other' {
  const mime = (att.contentType || '').toLowerCase()
  const fname = (att.filename || '').toLowerCase()

  if (mime.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg)$/.test(fname)) {
    return 'image'
  }
  if (mime === 'application/pdf' || fname.endsWith('.pdf')) {
    return 'pdf'
  }
  if (
    mime.startsWith('text/') ||
    mime === 'application/json' ||
    /\.(txt|json|csv|md|log|xml|html|js|ts|vue)$/.test(fname)
  ) {
    return 'text'
  }
  return 'other'
}

function getFileIcon(att: Attachment) {
  const type = getFileType(att)
  if (type === 'image') return ImageIcon
  if (type === 'pdf') return FileText
  if (type === 'text') return FileCode
  return File
}

async function getAttachmentBlob(att: Attachment): Promise<Blob> {
  const mailboxResourceId = props.message?.mailboxResourceId || 'res-dbb-1'
  const folder = (props.message?.path || 'INBOX').toUpperCase()
  const uid = Number(props.message?.uid || 101)
  const hostingerAccount = props.message?.hostingerAccount || 'DMBB'

  if (typeof window.hostinger?.getMessageAttachment !== 'function') {
    throw new Error('Attachment service unavailable')
  }

  const rawData = await window.hostinger.getMessageAttachment(
    mailboxResourceId,
    folder,
    uid,
    att.id,
    hostingerAccount
  )

  const mime = att.contentType || 'application/octet-stream'
  return new Blob([rawData], { type: mime })
}

async function downloadAttachment(att: Attachment) {
  if (loadingId.value) return
  loadingId.value = att.id
  errorMsg.value = null

  try {
    const blob = await getAttachmentBlob(att)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = att.filename || 'attachment'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  } catch (err: any) {
    console.error('Download attachment failed:', err)
    errorMsg.value = err?.message || 'Failed to download attachment'
  } finally {
    loadingId.value = null
  }
}

async function previewAttachment(att: Attachment) {
  if (loadingId.value) return
  const type = getFileType(att)

  if (type === 'other') {
    await downloadAttachment(att)
    return
  }

  loadingId.value = att.id
  errorMsg.value = null

  try {
    const blob = await getAttachmentBlob(att)
    clearPreview()

    previewAttachmentItem.value = att
    previewType.value = type

    if (type === 'text') {
      previewText.value = await blob.text()
    } else {
      previewUrl.value = URL.createObjectURL(blob)
    }

    isPreviewOpen.value = true
  } catch (err: any) {
    console.error('Preview attachment failed:', err)
    errorMsg.value = err?.message || 'Failed to preview attachment'
  } finally {
    loadingId.value = null
  }
}

function clearPreview() {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = null
  }
  previewText.value = null
  previewAttachmentItem.value = null
}

function handleClosePreview() {
  isPreviewOpen.value = false
  clearPreview()
}

onUnmounted(() => {
  clearPreview()
})
</script>

<template>
  <div
    v-if="attachments && attachments.length > 0"
    class="my-4 p-3 bg-muted/40 rounded-lg border text-foreground"
  >
    <div class="flex items-center justify-between mb-2">
      <h4 class="text-xs font-semibold text-foreground flex items-center gap-1.5">
        <Paperclip class="h-3.5 w-3.5 text-primary" />
        Attachments ({{ attachments.length }})
      </h4>
      <span v-if="errorMsg" class="text-[11px] text-destructive truncate max-w-[200px]">
        {{ errorMsg }}
      </span>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
      <div
        v-for="att in attachments"
        :key="att.id"
        class="group flex items-center justify-between p-2 rounded border bg-card text-xs hover:border-primary/50 transition-colors"
      >
        <div
          class="flex items-center gap-2 truncate mr-2 cursor-pointer flex-1 min-w-0"
          @click="previewAttachment(att)"
        >
          <component
            :is="getFileIcon(att)"
            class="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary transition-colors"
          />
          <div class="truncate">
            <p class="font-medium truncate text-foreground group-hover:text-primary transition-colors">
              {{ att.filename || 'Attachment' }}
            </p>
            <p class="text-[10px] text-muted-foreground">
              {{ formatFileSize(att.sizeBytes) }}
            </p>
          </div>
        </div>

        <div class="flex items-center gap-1 shrink-0">
          <!-- Preview Button -->
          <Button
            v-if="getFileType(att) !== 'other'"
            variant="ghost"
            size="icon"
            class="h-7 w-7 text-muted-foreground hover:text-foreground"
            :disabled="loadingId === att.id"
            title="Preview Attachment"
            @click.stop="previewAttachment(att)"
          >
            <Spinner v-if="loadingId === att.id" class="h-3.5 w-3.5" />
            <Eye v-else class="h-3.5 w-3.5" />
          </Button>

          <!-- Download Button -->
          <Button
            variant="ghost"
            size="icon"
            class="h-7 w-7 text-muted-foreground hover:text-foreground"
            :disabled="loadingId === att.id"
            title="Download Attachment"
            @click.stop="downloadAttachment(att)"
          >
            <Spinner v-if="loadingId === att.id" class="h-3.5 w-3.5" />
            <FileDown v-else class="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>

    <!-- Attachment Preview Modal Dialog -->
    <Dialog :open="isPreviewOpen" @update:open="handleClosePreview">
      <DialogContent class="max-w-4xl h-[80vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader class="p-4 border-b flex flex-row items-center justify-between gap-2 shrink-0">
          <DialogTitle class="text-sm font-semibold truncate flex items-center gap-2">
            <Paperclip class="h-4 w-4 text-primary shrink-0" />
            <span class="truncate">{{ previewAttachmentItem?.filename || 'Attachment Preview' }}</span>
          </DialogTitle>

          <div class="flex items-center gap-2 shrink-0 mr-6">
            <Button
              v-if="previewAttachmentItem"
              variant="outline"
              size="sm"
              class="h-8 text-xs gap-1.5"
              @click="downloadAttachment(previewAttachmentItem)"
            >
              <FileDown class="h-3.5 w-3.5" />
              Download
            </Button>
          </div>
        </DialogHeader>

        <!-- Preview Body Container -->
        <div class="flex-1 min-h-0 bg-muted/20 overflow-auto flex items-center justify-center p-4">
          <!-- Image Preview -->
          <img
            v-if="previewType === 'image' && previewUrl"
            :src="previewUrl"
            :alt="previewAttachmentItem?.filename || 'Image preview'"
            class="max-w-full max-h-full object-contain rounded shadow-sm"
          />

          <!-- PDF Preview -->
          <iframe
            v-else-if="previewType === 'pdf' && previewUrl"
            :src="previewUrl"
            class="w-full h-full rounded border bg-background"
          />

          <!-- Text Preview -->
          <pre
            v-else-if="previewType === 'text' && previewText !== null"
            class="w-full h-full p-4 bg-card border rounded text-xs font-mono overflow-auto whitespace-pre-wrap leading-relaxed text-foreground"
          >{{ previewText }}</pre>

          <!-- Fallback -->
          <div v-else class="text-sm text-muted-foreground">
            Unable to display preview for this file.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>
