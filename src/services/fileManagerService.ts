import { cacheService } from './cacheService'

export interface ManagedFile {
  id: string
  name: string
  sizeBytes: number
  formattedSize: string
  mimeType: string
  category: 'document' | 'spreadsheet' | 'image' | 'archive' | 'pdf' | 'other'
  mailboxAddress: string
  hostingerAccount: 'DMBB' | 'DBB'
  uploadedAt: string
  downloadUrl?: string
  contentPreview?: string
  sourceEmailSubject?: string
}

const FILES_STORAGE_KEY = 'file_manager_files'

const DEFAULT_SEED_FILES: ManagedFile[] = [
  {
    id: 'file-1',
    name: 'Purchase_Order_DBB_99824.pdf',
    sizeBytes: 2450000,
    formattedSize: '2.45 MB',
    mimeType: 'application/pdf',
    category: 'pdf',
    mailboxAddress: 'sales@dmbb.com',
    hostingerAccount: 'DMBB',
    uploadedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    sourceEmailSubject: 'Purchase Order Request #DBB-99824',
    contentPreview: 'CONFIDENTIAL PURCHASE ORDER\nOrder ID: DBB-99824\nVendor: Industrial Corp\nItems: 50x High Voltage Breakers\nTotal: $18,450.00 USD',
  },
  {
    id: 'file-2',
    name: 'Q3_Financial_Summary_2026.xlsx',
    sizeBytes: 1120000,
    formattedSize: '1.12 MB',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    category: 'spreadsheet',
    mailboxAddress: 'billing@dmbb.com',
    hostingerAccount: 'DMBB',
    uploadedAt: new Date(Date.now() - 1000 * 60 * 1440).toISOString(),
    sourceEmailSubject: 'Q3 Financial Reconciliation',
    contentPreview: 'Sheet: Overview\nRevenue: $142,500.00\nOPEX: $48,200.00\nNet Profit: $94,300.00',
  },
  {
    id: 'file-3',
    name: 'SSL_Cert_Key_Wildcard.zip',
    sizeBytes: 540000,
    formattedSize: '540 KB',
    mimeType: 'application/zip',
    category: 'archive',
    mailboxAddress: 'admin@dmbb.com',
    hostingerAccount: 'DMBB',
    uploadedAt: new Date(Date.now() - 1000 * 60 * 600).toISOString(),
    sourceEmailSubject: 'SSL Certificate Auto-Renewed Successfully',
    contentPreview: 'Encrypted Zip Archive containing cert.pem, fullchain.pem, and privatekey.pem.',
  },
  {
    id: 'file-4',
    name: 'Equipment_Diagram_SG02.jpg',
    sizeBytes: 3800000,
    formattedSize: '3.80 MB',
    mimeType: 'image/jpeg',
    category: 'image',
    mailboxAddress: 'marclouie@dbb.com',
    hostingerAccount: 'DBB',
    uploadedAt: new Date(Date.now() - 1000 * 60 * 2800).toISOString(),
    sourceEmailSubject: 'Equipment Schematic Update',
    contentPreview: 'High resolution schematic blueprint JPG image.',
  },
  {
    id: 'file-5',
    name: 'Hostinger_API_Docs_V1.pdf',
    sizeBytes: 890000,
    formattedSize: '890 KB',
    mimeType: 'application/pdf',
    category: 'pdf',
    mailboxAddress: 'support@dbb.com',
    hostingerAccount: 'DBB',
    uploadedAt: new Date(Date.now() - 1000 * 60 * 4000).toISOString(),
    sourceEmailSubject: 'Technical Reference Docs',
    contentPreview: 'Hostinger Mail API REST API Endpoint Specifications & Bearer Token Authentication manual.',
  },
]

class FileManagerService {
  /**
   * Get all managed files
   */
  public async getFiles(): Promise<ManagedFile[]> {
    const cached = cacheService.get<ManagedFile[]>(FILES_STORAGE_KEY)
    if (cached && Array.isArray(cached)) {
      return cached
    }

    // Seed initial files into persistent cache
    cacheService.set(FILES_STORAGE_KEY, DEFAULT_SEED_FILES, 30 * 24 * 60 * 60 * 1000) // 30 days
    return DEFAULT_SEED_FILES
  }

  /**
   * Add a new file
   */
  public async addFile(file: Omit<ManagedFile, 'id' | 'uploadedAt' | 'formattedSize'>): Promise<ManagedFile> {
    const files = await this.getFiles()

    const formatSize = (bytes: number) => {
      if (bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
    }

    const newFile: ManagedFile = {
      ...file,
      id: 'file-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      uploadedAt: new Date().toISOString(),
      formattedSize: formatSize(file.sizeBytes),
    }

    const updated = [newFile, ...files]
    cacheService.set(FILES_STORAGE_KEY, updated, 30 * 24 * 60 * 60 * 1000)
    return newFile
  }

  /**
   * Delete a file by ID
   */
  public async deleteFile(id: string): Promise<void> {
    const files = await this.getFiles()
    const updated = files.filter((f) => f.id !== id)
    cacheService.set(FILES_STORAGE_KEY, updated, 30 * 24 * 60 * 60 * 1000)
  }

  /**
   * Reset files to default seed
   */
  public async resetFiles(): Promise<ManagedFile[]> {
    cacheService.set(FILES_STORAGE_KEY, DEFAULT_SEED_FILES, 30 * 24 * 60 * 60 * 1000)
    return DEFAULT_SEED_FILES
  }
}

export const fileManagerService = new FileManagerService()
