<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  FolderGit2,
  Search,
  FileText,
  FileSpreadsheet,
  FileArchive,
  Image as ImageIcon,
  Download,
  Eye,
  Trash2,
  Plus,
  Grid,
  List,
  Mail,
  FileCheck,
  X,
  UploadCloud,
} from '@lucide/vue'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { fileManagerService, type ManagedFile } from '@/services/fileManagerService'

const files = ref<ManagedFile[]>([])
const loading = ref(false)
const searchQuery = ref('')
const selectedCategory = ref<string>('all')
const viewMode = ref<'grid' | 'list'>('grid')

const previewFile = ref<ManagedFile | null>(null)
const showUploadModal = ref(false)

// New File Form State
const newFileName = ref('')
const newFileCategory = ref<'document' | 'spreadsheet' | 'image' | 'archive' | 'pdf' | 'other'>('pdf')
const newFileAccount = ref<'DMBB' | 'DBB'>('DMBB')
const newFileMailbox = ref('sales@dmbb.com')
const newFileContent = ref('')

const loadFiles = async () => {
  loading.value = true
  try {
    files.value = await fileManagerService.getFiles()
  } finally {
    loading.value = false
  }
}

const filteredFiles = computed(() => {
  let result = files.value

  if (selectedCategory.value !== 'all') {
    result = result.filter((f) => f.category === selectedCategory.value)
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.mailboxAddress.toLowerCase().includes(q) ||
        (f.sourceEmailSubject && f.sourceEmailSubject.toLowerCase().includes(q))
    )
  }

  return result
})

const totalStorageBytes = computed(() => {
  return files.value.reduce((acc, f) => acc + f.sizeBytes, 0)
})

const formattedTotalStorage = computed(() => {
  const bytes = totalStorageBytes.value
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
})

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'spreadsheet':
      return FileSpreadsheet
    case 'image':
      return ImageIcon
    case 'archive':
      return FileArchive
    case 'pdf':
    case 'document':
      return FileText
    default:
      return FileText
  }
}

const getCategoryBadgeClass = (category: string) => {
  switch (category) {
    case 'spreadsheet':
      return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400'
    case 'image':
      return 'bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400'
    case 'archive':
      return 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400'
    case 'pdf':
      return 'bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400'
    default:
      return 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400'
  }
}

const handleDelete = async (id: string) => {
  await fileManagerService.deleteFile(id)
  await loadFiles()
}

const handleResetFiles = async () => {
  files.value = await fileManagerService.resetFiles()
}

const handleAddFile = async () => {
  if (!newFileName.value.trim()) return

  await fileManagerService.addFile({
    name: newFileName.value.trim(),
    sizeBytes: Math.floor(Math.random() * 2000000) + 200000,
    mimeType: 'application/octet-stream',
    category: newFileCategory.value,
    mailboxAddress: newFileMailbox.value,
    hostingerAccount: newFileAccount.value,
    sourceEmailSubject: 'Manually imported attachment',
    contentPreview: newFileContent.value || 'Uploaded document content stored in DBB File Manager.',
  })

  newFileName.value = ''
  newFileContent.value = ''
  showUploadModal.value = false
  await loadFiles()
}

const downloadSimulatedFile = (file: ManagedFile) => {
  const element = document.createElement('a')
  const content = file.contentPreview || `DBB File Content: ${file.name}`
  const blob = new Blob([content], { type: 'text/plain' })
  element.href = URL.createObjectURL(blob)
  element.download = file.name
  document.body.appendChild(element)
  element.click()
  document.body.removeChild(element)
}

onMounted(() => {
  loadFiles()
})
</script>

<template>
  <div class="flex flex-col h-full overflow-hidden bg-background">
    <!-- Top Header -->
    <header class="bg-background sticky top-0 flex shrink-0 items-center justify-between gap-2 border-b p-3.5 z-20">
      <div class="flex items-center gap-2 min-w-0">
        <SidebarTrigger class="-ml-1 shrink-0" />
        <Separator orientation="vertical" class="mr-2 shrink-0 data-[orientation=vertical]:h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <span class="text-muted-foreground text-xs font-medium">DBB Mail</span>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage class="font-semibold text-foreground text-xs">File Manager</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div class="flex items-center gap-2">
        <Button variant="outline" size="sm" class="h-8 gap-1.5 text-xs" @click="handleResetFiles">
          <FileCheck class="size-3.5" />
          <span>Restore Seed Files</span>
        </Button>

        <Button size="sm" class="h-8 gap-1.5 text-xs" @click="showUploadModal = true">
          <Plus class="size-3.5" />
          <span>Add Attachment</span>
        </Button>
      </div>
    </header>

    <!-- Main Content Area -->
    <div class="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 max-w-6xl mx-auto w-full">
      <!-- Top Storage Banner Card -->
      <div class="p-5 rounded-xl border bg-card text-card-foreground shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
            <FolderGit2 class="size-5" />
          </div>
          <div>
            <h1 class="text-base font-bold text-foreground">Email Attachments & Storage Manager</h1>
            <p class="text-xs text-muted-foreground">
              Manage files, documents, and attachments across your Hostinger DMBB and DBB mailboxes.
            </p>
          </div>
        </div>

        <div class="flex items-center gap-6 border-t md:border-t-0 pt-3 md:pt-0">
          <div class="text-right">
            <div class="text-xs text-muted-foreground font-medium">Total Attachments</div>
            <div class="text-lg font-bold text-foreground">{{ files.length }} Files</div>
          </div>
          <div class="text-right">
            <div class="text-xs text-muted-foreground font-medium">Cached Storage</div>
            <div class="text-lg font-bold text-primary">{{ formattedTotalStorage }}</div>
          </div>
        </div>
      </div>

      <!-- Controls & Filter Bar -->
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <!-- Search -->
        <div class="relative flex-1 max-w-md">
          <Search class="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            v-model="searchQuery"
            placeholder="Search files by name or mailbox..."
            class="pl-9 h-9 text-xs"
          />
        </div>

        <!-- Filter Categories & View Mode -->
        <div class="flex items-center justify-between sm:justify-end gap-2 overflow-x-auto pb-1 sm:pb-0">
          <div class="flex items-center gap-1 bg-muted/60 p-1 rounded-lg">
            <button
              v-for="cat in [
                { id: 'all', label: 'All' },
                { id: 'pdf', label: 'PDFs' },
                { id: 'spreadsheet', label: 'Sheets' },
                { id: 'image', label: 'Images' },
                { id: 'archive', label: 'Archives' },
              ]"
              :key="cat.id"
              class="px-2.5 py-1 text-xs rounded-md transition-colors"
              :class="selectedCategory === cat.id ? 'bg-background text-foreground font-semibold shadow-xs' : 'text-muted-foreground hover:text-foreground'"
              @click="selectedCategory = cat.id"
            >
              {{ cat.label }}
            </button>
          </div>

          <Separator orientation="vertical" class="h-6" />

          <!-- View Mode Toggle -->
          <div class="flex items-center gap-1 bg-muted/60 p-1 rounded-lg shrink-0">
            <button
              class="p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors"
              :class="viewMode === 'grid' ? 'bg-background text-foreground shadow-xs' : ''"
              title="Grid View"
              @click="viewMode = 'grid'"
            >
              <Grid class="size-4" />
            </button>
            <button
              class="p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors"
              :class="viewMode === 'list' ? 'bg-background text-foreground shadow-xs' : ''"
              title="List View"
              @click="viewMode = 'list'"
            >
              <List class="size-4" />
            </button>
          </div>
        </div>
      </div>

      <!-- GRID VIEW -->
      <div v-if="viewMode === 'grid'" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="file in filteredFiles"
          :key="file.id"
          class="p-4 rounded-xl border bg-card text-card-foreground shadow-xs hover:border-primary/50 transition-all flex flex-col justify-between group"
        >
          <div>
            <!-- Header: Category & Account badge -->
            <div class="flex items-center justify-between gap-2 mb-3">
              <Badge variant="outline" class="text-[10px] uppercase tracking-wider font-medium px-2 py-0.5" :class="getCategoryBadgeClass(file.category)">
                {{ file.category }}
              </Badge>
              <Badge variant="secondary" class="text-[10px] font-mono">
                {{ file.hostingerAccount }}
              </Badge>
            </div>

            <!-- Icon & File Name -->
            <div class="flex items-start gap-3 mb-3">
              <div class="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors shrink-0">
                <component :is="getCategoryIcon(file.category)" class="size-5" />
              </div>
              <div class="min-w-0 flex-1">
                <h3 class="text-xs font-semibold text-foreground truncate" :title="file.name">
                  {{ file.name }}
                </h3>
                <p class="text-[11px] text-muted-foreground font-mono mt-0.5">
                  {{ file.formattedSize }}
                </p>
              </div>
            </div>

            <!-- Mailbox info -->
            <div class="p-2 rounded-lg bg-muted/40 text-[11px] space-y-1 mb-3">
              <div class="flex items-center gap-1.5 text-muted-foreground truncate">
                <Mail class="size-3 shrink-0" />
                <span class="truncate font-mono">{{ file.mailboxAddress }}</span>
              </div>
              <div v-if="file.sourceEmailSubject" class="text-foreground/80 truncate text-[10px]" :title="file.sourceEmailSubject">
                Subject: {{ file.sourceEmailSubject }}
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center justify-end gap-1.5 pt-2 border-t">
            <Button variant="ghost" size="sm" class="h-7 text-xs gap-1 px-2" @click="previewFile = file">
              <Eye class="size-3.5" />
              <span>Preview</span>
            </Button>
            <Button variant="ghost" size="sm" class="h-7 text-xs gap-1 px-2" @click="downloadSimulatedFile(file)">
              <Download class="size-3.5" />
              <span>Download</span>
            </Button>
            <Button variant="ghost" size="icon" class="h-7 w-7 text-muted-foreground hover:text-destructive" @click="handleDelete(file.id)">
              <Trash2 class="size-3.5" />
            </Button>
          </div>
        </div>

        <div v-if="filteredFiles.length === 0" class="col-span-full p-12 text-center rounded-xl border border-dashed bg-card/50">
          <FolderGit2 class="size-8 mx-auto text-muted-foreground/50 mb-2" />
          <p class="text-sm font-medium text-foreground">No files match your search</p>
          <p class="text-xs text-muted-foreground mt-1">Try switching categories or clearing search filters.</p>
        </div>
      </div>

      <!-- LIST VIEW -->
      <div v-else class="rounded-xl border bg-card text-card-foreground shadow-xs overflow-hidden">
        <Table>
          <TableHeader class="bg-muted/50">
            <TableRow>
              <TableHead class="text-xs font-semibold">File Name</TableHead>
              <TableHead class="text-xs font-semibold">Category</TableHead>
              <TableHead class="text-xs font-semibold">Mailbox Account</TableHead>
              <TableHead class="text-xs font-semibold">Size</TableHead>
              <TableHead class="text-xs font-semibold">Date Added</TableHead>
              <TableHead class="text-xs font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            <TableRow v-if="filteredFiles.length === 0">
              <TableCell colspan="6" class="h-24 text-center text-xs text-muted-foreground">
                No attachment files found.
              </TableCell>
            </TableRow>

            <TableRow v-for="file in filteredFiles" :key="file.id" class="text-xs">
              <TableCell>
                <div class="flex items-center gap-2.5">
                  <component :is="getCategoryIcon(file.category)" class="size-4 text-primary shrink-0" />
                  <span class="font-medium text-foreground truncate max-w-xs" :title="file.name">
                    {{ file.name }}
                  </span>
                </div>
              </TableCell>

              <TableCell>
                <Badge variant="outline" class="text-[10px] uppercase font-mono px-1.5 py-0" :class="getCategoryBadgeClass(file.category)">
                  {{ file.category }}
                </Badge>
              </TableCell>

              <TableCell class="font-mono text-[11px] text-muted-foreground">
                {{ file.mailboxAddress }}
              </TableCell>

              <TableCell class="font-mono text-[11px]">
                {{ file.formattedSize }}
              </TableCell>

              <TableCell class="text-muted-foreground text-[11px]">
                {{ new Date(file.uploadedAt).toLocaleDateString() }}
              </TableCell>

              <TableCell class="text-right space-x-1">
                <Button variant="ghost" size="icon" class="h-7 w-7" title="Preview" @click="previewFile = file">
                  <Eye class="size-3.5" />
                </Button>
                <Button variant="ghost" size="icon" class="h-7 w-7" title="Download" @click="downloadSimulatedFile(file)">
                  <Download class="size-3.5" />
                </Button>
                <Button variant="ghost" size="icon" class="h-7 w-7 text-muted-foreground hover:text-destructive" title="Delete" @click="handleDelete(file.id)">
                  <Trash2 class="size-3.5" />
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>

    <!-- PREVIEW MODAL -->
    <div
      v-if="previewFile"
      class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div class="bg-card text-card-foreground border rounded-xl shadow-xl max-w-lg w-full p-5 space-y-4">
        <div class="flex items-center justify-between pb-3 border-b">
          <div class="flex items-center gap-2 min-w-0">
            <component :is="getCategoryIcon(previewFile.category)" class="size-5 text-primary shrink-0" />
            <h2 class="text-sm font-bold text-foreground truncate">{{ previewFile.name }}</h2>
          </div>
          <Button variant="ghost" size="icon" class="h-7 w-7" @click="previewFile = null">
            <X class="size-4" />
          </Button>
        </div>

        <div class="space-y-2 text-xs">
          <div class="grid grid-cols-2 gap-2 p-2.5 bg-muted/40 rounded-lg text-[11px]">
            <div><span class="text-muted-foreground">Size:</span> <span class="font-mono">{{ previewFile.formattedSize }}</span></div>
            <div><span class="text-muted-foreground">Account:</span> <span class="font-mono">{{ previewFile.hostingerAccount }}</span></div>
            <div><span class="text-muted-foreground">Mailbox:</span> <span class="font-mono">{{ previewFile.mailboxAddress }}</span></div>
            <div><span class="text-muted-foreground">Category:</span> <span class="uppercase font-mono">{{ previewFile.category }}</span></div>
          </div>

          <div class="p-3 bg-muted/30 border rounded-lg max-h-48 overflow-y-auto font-mono text-[11px] whitespace-pre-wrap text-foreground">
            {{ previewFile.contentPreview || 'No content preview available for this document.' }}
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 pt-2 border-t">
          <Button variant="outline" size="sm" class="h-8 text-xs" @click="previewFile = null">
            Close
          </Button>
          <Button size="sm" class="h-8 text-xs gap-1.5" @click="downloadSimulatedFile(previewFile)">
            <Download class="size-3.5" />
            <span>Download File</span>
          </Button>
        </div>
      </div>
    </div>

    <!-- ADD ATTACHMENT MODAL -->
    <div
      v-if="showUploadModal"
      class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div class="bg-card text-card-foreground border rounded-xl shadow-xl max-w-md w-full p-5 space-y-4">
        <div class="flex items-center justify-between pb-3 border-b">
          <div class="flex items-center gap-2">
            <UploadCloud class="size-5 text-primary" />
            <h2 class="text-sm font-bold text-foreground">Import / Add Mail Attachment</h2>
          </div>
          <Button variant="ghost" size="icon" class="h-7 w-7" @click="showUploadModal = false">
            <X class="size-4" />
          </Button>
        </div>

        <div class="space-y-3 text-xs">
          <div>
            <label class="block font-medium mb-1">File Name</label>
            <Input v-model="newFileName" placeholder="e.g. Contract_2026.pdf" class="h-8 text-xs" />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-medium mb-1">Category</label>
              <select v-model="newFileCategory" class="w-full h-8 rounded-md border border-input bg-background px-2 text-xs">
                <option value="pdf">PDF Document</option>
                <option value="document">Text / Word</option>
                <option value="spreadsheet">Spreadsheet</option>
                <option value="image">Image</option>
                <option value="archive">Archive Zip</option>
              </select>
            </div>

            <div>
              <label class="block font-medium mb-1">Account</label>
              <select v-model="newFileAccount" class="w-full h-8 rounded-md border border-input bg-background px-2 text-xs">
                <option value="DMBB">DMBB</option>
                <option value="DBB">DBB</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block font-medium mb-1">Target Mailbox Address</label>
            <Input v-model="newFileMailbox" placeholder="e.g. sales@dmbb.com" class="h-8 text-xs" />
          </div>

          <div>
            <label class="block font-medium mb-1">Simulated File Body Text</label>
            <textarea v-model="newFileContent" rows="3" placeholder="Enter preview content..." class="w-full rounded-md border border-input bg-background p-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none"></textarea>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 pt-2 border-t">
          <Button variant="outline" size="sm" class="h-8 text-xs" @click="showUploadModal = false">
            Cancel
          </Button>
          <Button size="sm" class="h-8 text-xs" @click="handleAddFile">
            Save File
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
