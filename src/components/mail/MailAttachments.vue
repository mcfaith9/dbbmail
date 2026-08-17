<script setup lang="ts">
import { ref, onUnmounted, nextTick } from 'vue'
import {
  Paperclip,
  Download,
  Eye,
  FileText,
  Image as ImageIcon,
  FileCode,
  File,
} from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import type { Attachment, Message } from '@/types/mail'
import { useMailFormatting } from '@/composables/useMailFormatting'
import { UDocClient } from '@docmentis/udoc-viewer'

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
const viewerContainer = ref<HTMLElement | null>(null)
const previewType = ref<
  'image' | 'pdf' | 'text' | 'document' | 'other'
>('other')
const previewLoading = ref(false)

let udocClient: UDocClient | null = null
let udocViewer: Awaited<ReturnType<UDocClient['createViewer']>> | null = null

function getFileType(
  att: Attachment
): 'image' | 'pdf' | 'text' | 'document' | 'other' {
  const mime = (att.contentType || '').toLowerCase()
  const fname = (att.filename || '').toLowerCase()

  // Images
  if (
    mime.startsWith('image/') ||
    /\.(png|jpe?g|gif|webp|svg|bmp|tiff?)$/.test(fname)
  ) {
    return 'image'
  }

  // PDF
  if (
    mime === 'application/pdf' ||
    fname.endsWith('.pdf')
  ) {
    return 'pdf'
  }

  // Office documents / spreadsheets / presentations
  if (
    mime.includes('word') ||
    mime.includes('spreadsheet') ||
    mime.includes('presentation') ||
    /\.(doc|docx|xlsx|ppt|pptx)$/.test(fname)
  ) {
    return 'document'
  }

  // Text
  if (
    mime.startsWith('text/') ||
    mime === 'application/json' ||
    /\.(txt|json|csv|md|log|xml|html|js|ts|vue)$/.test(fname)
  ) {
    return 'text'
  }

  // Old Excel format
  if (
    mime === 'application/vnd.ms-excel' ||
    fname.endsWith('.xls')
  ) {
    return 'other'
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
  previewLoading.value = true
  errorMsg.value = null

  try {
    const blob = await getAttachmentBlob(att)

    // Clear any previous preview FIRST
    clearPreview()

    // Then set the new preview
    previewAttachmentItem.value = att
    previewType.value = type
    isPreviewOpen.value = true

    await nextTick()

    if (type === 'text') {
      previewText.value = await blob.text()
      return
    }

    await initializeDocumentViewer()

    if (!udocViewer) {
      throw new Error('Document viewer unavailable')
    }

    const buffer = await blob.arrayBuffer()
    const bytes = new Uint8Array(buffer)

    await udocViewer.load(bytes)
  } catch (err: any) {
    console.error('[Document Preview Error]', {
      filename: att.filename,
      contentType: att.contentType,
      error: err,
    })

    errorMsg.value =
      err?.message || `Failed to preview ${att.filename || 'attachment'}`

    isPreviewOpen.value = false
  } finally {
    loadingId.value = null
    previewLoading.value = false
  }
}

async function initializeDocumentViewer() {
  if (!viewerContainer.value) {
    throw new Error('Document viewer container unavailable')
  }

  if (!udocClient) {
    udocClient = await UDocClient.create()
  }

  if (udocViewer) {
    try {
      udocViewer.close()
    } catch {}
    udocViewer = null
  }

  udocViewer = await udocClient.createViewer({
    container: viewerContainer.value,
    scrollMode: 'continuous',
    layoutMode: 'single-page',
    zoomMode: 'fit-spread-width',
    theme: 'system',
    disableSearch: false,
    disableThumbnails: false,
    disableFullscreen: false,
  })

  udocViewer.setActiveTool({ kind: 'hand' });

  udocViewer.on('error', ({ error, phase }) => {
    console.error('[docMentis] Viewer error:', {
      phase,
      error,
      filename: previewAttachmentItem.value?.filename,
      contentType: previewAttachmentItem.value?.contentType,
    })
  })
}

function clearPreview() {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = null
  }

  previewText.value = null
  previewAttachmentItem.value = null

  if (udocViewer) {
    try {
      udocViewer.close()
    } catch (err) {
      console.warn('Failed to close document viewer:', err)
    }

    udocViewer = null
  }
}

function handleClosePreview() {
  isPreviewOpen.value = false
  clearPreview()
}

onUnmounted(() => {
  try {
    udocViewer?.destroy()
    udocViewer = null

    udocClient?.destroy()
    udocClient = null
  } catch (err) {
    console.warn('Failed to destroy document viewer:', err)
  }

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
            <Download v-else class="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>

    <!-- Attachment Preview Modal Dialog -->
    <Dialog :open="isPreviewOpen" @update:open="handleClosePreview">
      <DialogContent
        class="!w-[65vw] !max-w-[65vw] !h-[80vh] !max-h-[80vh] flex flex-col p-0 gap-0 overflow-hidden"
      >
        <DialogHeader
          class="h-14 px-4 border-b flex flex-row items-center justify-between gap-2 shrink-0"
        >
          <DialogTitle class="text-sm font-semibold truncate flex items-center gap-2">
            <Paperclip class="h-4 w-4 text-primary shrink-0" />
            <span class="truncate">{{ previewAttachmentItem?.filename || 'Attachment Preview' }}</span>
          </DialogTitle>

          <DialogDescription class="sr-only">
            Preview of {{ previewAttachmentItem?.filename || 'attachment' }}
          </DialogDescription>

          <div class="flex items-center gap-2 shrink-0 mr-6">
            <Button
              v-if="previewAttachmentItem"
              variant="outline"
              size="sm"
              class="h-8 text-xs gap-1.5"
              @click="downloadAttachment(previewAttachmentItem)"
            >
              <Download class="h-3.5 w-3.5" />
              Download
            </Button>
          </div>
        </DialogHeader>

        <!-- Preview Body Container -->
        <div class="relative flex-1 min-h-0 w-full overflow-hidden">

          <!-- Loading -->
          <div
            v-if="previewLoading"
            class="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm"
          >
            <Spinner class="h-8 w-8 mb-3" />

            <p class="text-sm font-medium">
              Opening {{ previewAttachmentItem?.filename || 'attachment' }}...
            </p>

            <p class="text-xs text-muted-foreground mt-1">
              Preparing document preview
            </p>
          </div>

          <!-- Text -->
          <pre
            v-if="previewType === 'text' && previewText !== null"
            class="w-full h-full p-6 bg-card overflow-auto whitespace-pre-wrap leading-relaxed text-xs font-mono text-foreground"
          >{{ previewText }}</pre>

          <!-- docMentis -->
          <div
            v-else
            ref="viewerContainer"
            class="w-full h-full"
          ></div>

        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>
