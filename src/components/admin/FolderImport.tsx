import { useState, useRef, useCallback, type InputHTMLAttributes } from 'react'
import { useTranslation } from 'next-i18next'
import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import {
  FolderIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowUpTrayIcon,
  ServerStackIcon,
  FolderOpenIcon,
  ChevronUpIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

interface FolderImportProps {
  onImportComplete: (createdPropertyId?: string) => void
}

type UploadUiState =
  | null
  | {
      kind: 'progress'
      loaded: number
      total: number
      filesDone: number
      filesTotal: number
    }

type UploadEntry = { file: File; relPath: string }

type FileSystemEntryLike = {
  isFile: boolean
  isDirectory: boolean
  name: string
  fullPath?: string
}

type FileSystemFileEntryLike = FileSystemEntryLike & {
  file: (callback: (file: File) => void, errorCallback?: (error: DOMException) => void) => void
}

type FileSystemDirectoryEntryLike = FileSystemEntryLike & {
  createReader: () => {
    readEntries: (
      successCallback: (entries: FileSystemEntryLike[]) => void,
      errorCallback?: (error: DOMException) => void
    ) => void
  }
}

type DataTransferItemWithEntry = DataTransferItem & {
  webkitGetAsEntry?: () => FileSystemEntryLike | null
}

const UPLOAD_CONCURRENCY = 6
const MAX_RETRIES_PER_FILE = 2

function genUploadId(): string {
  const rand = Math.random().toString(36).slice(2, 10)
  return `${Date.now()}-${rand}`
}

export default function FolderImport({ onImportComplete }: FolderImportProps) {
  const { t } = useTranslation('admin')
  const folderInputAttributes: InputHTMLAttributes<HTMLInputElement> & {
    webkitdirectory?: string
    directory?: string
  } = {
    webkitdirectory: '',
    directory: '',
  }

  const [isImporting, setIsImporting] = useState(false)
  /** Browser upload is often the bottleneck on prod (single huge multipart request). */
  const [importPhase, setImportPhase] = useState<'idle' | 'upload' | 'import'>('idle')
  const [importStats, setImportStats] = useState<{ files: number; mb: string } | null>(null)
  const [uploadUi, setUploadUi] = useState<UploadUiState>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFolder, setSelectedFolder] = useState<string>('')
  const [importResults, setImportResults] = useState<{
    success: string[]
    errors: string[]
    total: number
    successful: number
    failed: number
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isProcessingRef = useRef(false)
  const [serverPath, setServerPath] = useState('')
  const [isImportingFromPath, setIsImportingFromPath] = useState(false)

  // Browse server folders modal
  const [browseOpen, setBrowseOpen] = useState(false)
  const [browseCurrentPath, setBrowseCurrentPath] = useState('')
  const [browseRoots, setBrowseRoots] = useState<{ name: string; path: string }[]>([])
  const [browseFolders, setBrowseFolders] = useState<{ name: string; path: string }[]>([])
  const [browseParentPath, setBrowseParentPath] = useState<string | null>(null)
  const [browseLoading, setBrowseLoading] = useState(false)
  const [browseError, setBrowseError] = useState<string | null>(null)

  const loadBrowse = useCallback(async (path: string | null) => {
    setBrowseLoading(true)
    setBrowseError(null)
    try {
      const q = path ? `?path=${encodeURIComponent(path)}` : ''
      const res = await fetch(`/api/properties/browse-folders${q}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || data.error || 'Failed to load')
      setBrowseRoots(data.roots || [])
      setBrowseFolders(data.folders || [])
      setBrowseParentPath(data.parentPath ?? null)
      setBrowseCurrentPath(data.currentPath ?? (path || ''))
    } catch (e: unknown) {
      setBrowseError((e as Error).message)
      setBrowseRoots([])
      setBrowseFolders([])
      setBrowseParentPath(null)
    } finally {
      setBrowseLoading(false)
    }
  }, [])

  const openBrowse = () => {
    setBrowseOpen(true)
    setBrowseCurrentPath('')
    loadBrowse(null)
  }

  const selectBrowseFolder = (path: string) => {
    setServerPath(path)
    setBrowseOpen(false)
  }


  const formatSize = (size: number) => {
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
    if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`
    return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`
  }

  const getErrorMessage = (error: unknown, fallback: string) => {
    if (error instanceof Error && error.message) return error.message
    return fallback
  }

  const getReadableImportError = (error: unknown, fallback: string) => {
    const message = getErrorMessage(error, fallback)
    if (message.includes('Failed to fetch')) {
      return t('folderImport.networkError')
    }
    if (message.includes('does not exist in the current database')) {
      return t('folderImport.dbSchemaMismatch')
    }
    return message
  }

  const readFileEntry = (entry: FileSystemFileEntryLike): Promise<File> =>
    new Promise((resolveFile, rejectFile) => {
      entry.file(resolveFile, rejectFile)
    })

  const readAllDirectoryEntries = async (dirEntry: FileSystemDirectoryEntryLike): Promise<FileSystemEntryLike[]> => {
    const reader = dirEntry.createReader()
    const entries: FileSystemEntryLike[] = []
    while (true) {
      const chunk = await new Promise<FileSystemEntryLike[]>((resolveChunk, rejectChunk) => {
        reader.readEntries(resolveChunk, rejectChunk)
      })
      if (chunk.length === 0) break
      entries.push(...chunk)
    }
    return entries
  }

  const collectEntriesFromDrop = useCallback(async (dataTransfer: DataTransfer): Promise<UploadEntry[]> => {
    const results: UploadEntry[] = []

    const walk = async (entry: FileSystemEntryLike, prefix: string) => {
      if (entry.isFile) {
        const file = await readFileEntry(entry as FileSystemFileEntryLike)
        results.push({ file, relPath: `${prefix}${entry.name}` })
        return
      }
      if (!entry.isDirectory) return
      const dir = entry as FileSystemDirectoryEntryLike
      const children = await readAllDirectoryEntries(dir)
      const nextPrefix = `${prefix}${entry.name}/`
      await Promise.all(children.map((child) => walk(child, nextPrefix)))
    }

    const items = Array.from(dataTransfer.items || [])
    const entries = items
      .map((item) => (item as DataTransferItemWithEntry).webkitGetAsEntry?.() || null)
      .filter((entry): entry is FileSystemEntryLike => Boolean(entry))

    if (entries.length > 0) {
      await Promise.all(entries.map((entry) => walk(entry, '')))
      return results
    }

    return Array.from(dataTransfer.files || []).map((file) => ({ file, relPath: file.name }))
  }, [])

  /**
   * Upload one file via raw streaming XHR. Reports per-chunk byte delta via onDelta,
   * so the caller can aggregate progress across N parallel uploads without races.
   */
  const uploadSingleFile = useCallback(
    (
      file: File,
      relPath: string,
      uploadId: string,
      onDelta: (delta: number) => void
    ) =>
      new Promise<{ folderPath: string }>((resolveUpload, rejectUpload) => {
        const url =
          `/api/properties/upload-folder-stream` +
          `?uploadId=${encodeURIComponent(uploadId)}` +
          `&path=${encodeURIComponent(relPath)}`
        const xhr = new XMLHttpRequest()
        xhr.open('POST', url)
        xhr.setRequestHeader('Content-Type', 'application/octet-stream')

        let lastLoaded = 0
        xhr.upload.onprogress = (ev) => {
          if (!ev.lengthComputable) return
          const delta = ev.loaded - lastLoaded
          if (delta > 0) {
            lastLoaded = ev.loaded
            onDelta(delta)
          }
        }
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            // Account for any bytes not reported by final onprogress event.
            const remaining = file.size - lastLoaded
            if (remaining > 0) onDelta(remaining)
            try {
              const data = JSON.parse(xhr.responseText || '{}') as { folderPath?: string }
              if (!data.folderPath) {
                rejectUpload(new Error(t('folderImport.uploadNoPath')))
                return
              }
              resolveUpload({ folderPath: data.folderPath })
            } catch {
              rejectUpload(new Error(t('folderImport.uploadBadResponse')))
            }
            return
          }
          let msg = `${t('folderImport.serverErrorShort')}: ${xhr.status}`
          try {
            const err = JSON.parse(xhr.responseText || '{}') as { message?: string; error?: string }
            msg = err.message || err.error || msg
          } catch {
            /* ignore */
          }
          if (xhr.status === 413) msg = t('folderImport.tooLarge')
          rejectUpload(new Error(msg))
        }
        xhr.onerror = () => rejectUpload(new TypeError('Failed to fetch'))
        xhr.onabort = () => rejectUpload(new Error('Upload aborted'))
        xhr.send(file)
      }),
    [t]
  )

  /**
   * Upload all files in parallel (N at a time). Reports aggregate progress via setUploadUi.
   * Returns the uploaded folderPath (absolute path on server under uploads/incoming/{uploadId}/).
   */
  const uploadFolderParallel = useCallback(
    async (
      entries: { file: File; relPath: string }[]
    ): Promise<{ folderPath: string }> => {
      const uploadId = genUploadId()
      const totalBytes = entries.reduce((acc, e) => acc + e.file.size, 0)
      let loadedBytes = 0
      let filesDone = 0

      // Throttle React updates (every ~100ms) so rapid onprogress deltas don't spam re-renders.
      let pendingFlush: number | null = null
      const flushUi = () => {
        pendingFlush = null
        setUploadUi({
          kind: 'progress',
          loaded: loadedBytes,
          total: totalBytes,
          filesDone,
          filesTotal: entries.length,
        })
      }
      const scheduleFlush = () => {
        if (pendingFlush !== null) return
        pendingFlush = window.setTimeout(flushUi, 100)
      }

      const onDelta = (delta: number) => {
        loadedBytes += delta
        scheduleFlush()
      }

      setUploadUi({
        kind: 'progress',
        loaded: 0,
        total: totalBytes,
        filesDone: 0,
        filesTotal: entries.length,
      })

      let folderPath = ''
      let nextIndex = 0
      let failure: Error | null = null

      const worker = async () => {
        while (true) {
          if (failure) return
          const i = nextIndex++
          if (i >= entries.length) return
          const { file, relPath } = entries[i]
          let attempt = 0
          let bytesReportedThisFile = 0
          while (true) {
            try {
              const localOnDelta = (d: number) => {
                bytesReportedThisFile += d
                onDelta(d)
              }
              const res = await uploadSingleFile(file, relPath, uploadId, localOnDelta)
              if (!folderPath) folderPath = res.folderPath
              filesDone++
              scheduleFlush()
              break
            } catch (err) {
              // Roll back byte counter for this file before retry so UI doesn't overshoot.
              if (bytesReportedThisFile > 0) {
                loadedBytes -= bytesReportedThisFile
                bytesReportedThisFile = 0
                scheduleFlush()
              }
              if (attempt >= MAX_RETRIES_PER_FILE) {
                failure = err as Error
                return
              }
              attempt++
              await new Promise((r) => setTimeout(r, 500 * attempt))
            }
          }
        }
      }

      const workers: Promise<void>[] = []
      const concurrency = Math.min(UPLOAD_CONCURRENCY, entries.length)
      for (let c = 0; c < concurrency; c++) workers.push(worker())
      await Promise.all(workers)

      if (pendingFlush !== null) {
        window.clearTimeout(pendingFlush)
        flushUi()
      }

      if (failure) throw failure
      if (!folderPath) throw new Error(t('folderImport.uploadNoPath'))
      return { folderPath }
    },
    [t, uploadSingleFile]
  )

  const handleImportFromServerPath = async () => {
    const path = serverPath.trim()
    if (!path) {
      alert(t('folderImport.pathRequired'))
      return
    }
    if (isImportingFromPath) return
    setIsImportingFromPath(true)
    setImportPhase('import')
    setImportStats(null)
    setImportResults(null)

    try {
      const response = await fetch('/api/properties/import-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderPath: path }),
      })
      const contentType = response.headers.get('content-type')
      let data: { results?: { success?: string[]; errors?: string[] }; total?: number; successful?: number; failed?: number; error?: string; message?: string; createdPropertyIds?: string[] } = {}
      try {
        const text = await response.text()
        const isHtml = text && (text.trimStart().toLowerCase().startsWith('<!') || text.includes('<html'))
        if (text && contentType?.includes('application/json') && !isHtml) {
          data = JSON.parse(text) as typeof data
        } else if (isHtml || (!response.ok && text)) {
          const msg = isHtml ? t('folderImport.importHtmlError') : text.slice(0, 200)
          throw new Error(msg)
        }
      } catch (parseError: unknown) {
        if (parseError instanceof SyntaxError) {
          throw new Error(`Server returned invalid response (${response.status}). Import may have timed out or failed.`)
        }
        throw parseError
      }

      if (!response.ok) {
        throw new Error(data.error || data.message || `Server error: ${response.status}`)
      }

      setImportResults({
        success: data.results?.success || [],
        errors: data.results?.errors || [],
        total: data.total ?? 0,
        successful: data.successful ?? 0,
        failed: data.failed ?? 0,
      })
      if ((data.successful ?? 0) > 0) {
        onImportComplete(data.createdPropertyIds?.[0])
      }
    } catch (error: unknown) {
      const errorMessage = getReadableImportError(error, 'Import failed')
      console.error(`[${new Date().toISOString()}] [folder-import] import from server path failed`, {
        path,
        error: errorMessage,
      })
      setImportResults({
        success: [],
        errors: [errorMessage],
        total: 0,
        successful: 0,
        failed: 1,
      })
    } finally {
      setIsImportingFromPath(false)
      setImportPhase('idle')
    }
  }

  const handleFolderSelect = (files: FileList | null) => {
    if (!files || files.length === 0) {
      alert(t('folderImport.noFilesSelected'))
      return
    }

    const entries = Array.from(files).map((file) => ({
      file,
      relPath: file.webkitRelativePath || file.name,
    }))
    const firstFile = entries[0]
    const relativePath = firstFile.relPath || ''
    const folderName = relativePath.split('/')[0] || 'Selected folder'

    setSelectedFolder(folderName)
    processEntries(entries)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFolderSelect(e.target.files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    if (isImporting) return
    try {
      const entries = await collectEntriesFromDrop(e.dataTransfer)
      if (entries.length === 0) {
        alert(t('folderImport.noFilesDropped'))
        return
      }
      const folderName = entries[0].relPath.split('/')[0] || 'Selected folder'
      setSelectedFolder(folderName)
      await processEntries(entries)
    } catch (error) {
      console.error(`[${new Date().toISOString()}] [folder-import] drag-drop read failed`, { error })
      alert(t('folderImport.uploadBadResponse'))
    }
  }

  const processEntries = async (entries: UploadEntry[]) => {
    if (isProcessingRef.current) return
    isProcessingRef.current = true
    setIsImporting(true)
    setImportPhase('upload')
    setImportResults(null)

    try {
      const MAX_TOTAL_SIZE = 10 * 1024 * 1024 * 1024 // 10GB
      let totalSize = 0
      entries.forEach(({ file }) => { totalSize += file.size })

      if (totalSize > MAX_TOTAL_SIZE) {
        const sizeInGB = (totalSize / (1024 * 1024 * 1024)).toFixed(2)
        throw new Error(t('folderImport.totalSizeExceeded', { sizeInGB }))
      }

      setImportStats({
        files: entries.length,
        mb: (totalSize / (1024 * 1024)).toFixed(1),
      })

      // Build relative paths; skip hidden junk files (.DS_Store etc.) early.
      const normalizedEntries: UploadEntry[] = []
      for (const { file, relPath } of entries) {
        const rel = relPath || file.name
        const base = rel.split('/').pop() || rel
        if (base.startsWith('.')) continue
        normalizedEntries.push({ file, relPath: rel })
      }
      if (normalizedEntries.length === 0) {
        throw new Error(t('folderImport.uploadNoPath'))
      }

      // Phase 1: parallel streaming upload — 6 files at a time, real aggregate progress.
      const uploadData = await uploadFolderParallel(normalizedEntries)
      const folderPath = uploadData.folderPath
      if (!folderPath || typeof folderPath !== 'string') {
        throw new Error(t('folderImport.uploadNoPath'))
      }

      setUploadUi(null)
      setImportPhase('import')

      // Phase 2: import from uploaded folder and create property in DB
      const importResponse = await fetch('/api/properties/import-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderPath }),
      })

      const contentType = importResponse.headers.get('content-type')
      let data: { results?: { success?: string[]; errors?: string[] }; total?: number; successful?: number; failed?: number; error?: string; message?: string; createdPropertyIds?: string[] } = {}
      const text = await importResponse.text()
      const isHtml = text && (text.trimStart().toLowerCase().startsWith('<!') || text.includes('<html'))
      if (text && contentType?.includes('application/json') && !isHtml) {
        data = JSON.parse(text) as typeof data
        } else if (isHtml || (!importResponse.ok && text)) {
          const msg = isHtml ? t('folderImport.importHtmlError') : text.slice(0, 200)
          throw new Error(msg)
        }

      if (!importResponse.ok) {
        // Uploaded files remain in uploads/incoming/{uploadId}/; user can re-import via "Import from server path"
        throw new Error(data.error || data.message || `Import error: ${importResponse.status}`)
      }

      setImportResults({
        success: data.results?.success || [],
        errors: data.results?.errors || [],
        total: data.total ?? 0,
        successful: data.successful ?? 0,
        failed: data.failed ?? 0,
      })

      if ((data.successful ?? 0) > 0) {
        onImportComplete(data.createdPropertyIds?.[0])
      }
    } catch (error: unknown) {
      const errorMessage = getReadableImportError(error, 'Unknown error')
      console.error(`[${new Date().toISOString()}] [folder-import] upload/import failed`, {
        error: errorMessage,
      })
      // If upload succeeded but import failed, data is still in uploads/ – user can re-import from server path
      setImportResults({
        success: [],
        errors: [errorMessage],
        total: 0,
        successful: 0,
        failed: 1,
      })
    } finally {
      isProcessingRef.current = false
      setIsImporting(false)
      setImportPhase('idle')
      setImportStats(null)
      setUploadUi(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div>
      <div className="flex items-center space-x-3 mb-4">
        <FolderIcon className="h-6 w-6 text-champagne" />
        <h2 className="text-xl font-semibold text-graphite">{t('folderImport.title')}</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('folderImport.dropHint')}
          </label>

          {/* Drag & Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => {
              if (isImporting) return
              fileInputRef.current?.click()
            }}
            className={`
              relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragging 
                ? 'border-champagne bg-champagne/10' 
                : 'border-gray-300 hover:border-champagne hover:bg-gray-50'
              }
              ${isImporting ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              {...folderInputAttributes}
              multiple
              onChange={handleFileInputChange}
              className="hidden"
              disabled={isImporting}
            />
            
            <div className="flex flex-col items-center">
              {isImporting ? (
                <>
                  <svg className="animate-spin h-12 w-12 mb-4 text-champagne" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="text-lg font-medium text-graphite mb-2">
                    {importPhase === 'upload' ? t('folderImport.phaseUpload') : t('folderImport.phaseProcess')}
                  </p>
                  <p className="text-sm text-gray-500 max-w-md mx-auto">
                    {importPhase === 'upload'
                      ? t('folderImport.phaseUploadHelp')
                      : t('folderImport.phaseProcessHelp')}
                  </p>
                  {importPhase === 'upload' && importStats && (
                    <p className="text-xs text-champagne mt-2 font-medium">
                      {t('folderImport.filesSize', { count: importStats.files, mb: importStats.mb })}
                    </p>
                  )}
                  {importPhase === 'upload' && uploadUi?.kind === 'progress' && (
                    <div className="w-full max-w-md mx-auto mt-4">
                      {(() => {
                        const pct = uploadUi.total > 0
                          ? Math.min(100, Math.floor((uploadUi.loaded / uploadUi.total) * 100))
                          : 0
                        return (
                          <>
                            <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-champagne transition-[width] duration-300 ease-out"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <p className="text-xs text-gray-700 mt-1.5 font-medium">
                              {t('folderImport.uploadProgress', {
                                loaded: formatSize(uploadUi.loaded),
                                total: formatSize(uploadUi.total),
                                pct,
                              })}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {t('folderImport.uploadFiles', {
                                done: uploadUi.filesDone,
                                total: uploadUi.filesTotal,
                              })}
                            </p>
                          </>
                        )
                      })()}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <ArrowUpTrayIcon className={`h-12 w-12 mb-4 ${isDragging ? 'text-champagne' : 'text-gray-400'}`} />
                  <p className="text-lg font-medium text-graphite mb-2">
                    {selectedFolder || t('folderImport.dropHint')}
                  </p>
                </>
              )}
            </div>
          </div>

          {selectedFolder && !isImporting && (
            <div className="mt-2 text-sm text-green-600">
              ✓ {t('folderImport.selected', { name: selectedFolder })}
            </div>
          )}
        </div>

        <details className="border-t border-gray-200 pt-4 group">
          <summary className="text-sm font-medium text-gray-700 cursor-pointer list-none flex items-center justify-center gap-2 [&::-webkit-details-marker]:hidden">
            <ServerStackIcon className="h-5 w-5 text-champagne shrink-0" />
            <span className="underline underline-offset-2">{t('folderImport.advancedSummary')}</span>
          </summary>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={openBrowse}
              disabled={isImporting || isImportingFromPath}
              className="inline-flex items-center gap-2 rounded-md border border-champagne px-5 py-2.5 text-sm font-semibold text-champagne hover:bg-champagne/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FolderOpenIcon className="h-5 w-5" />
              {t('folderImport.browse')}
            </button>
            <button
              type="button"
              onClick={handleImportFromServerPath}
              disabled={isImporting || isImportingFromPath || !serverPath.trim()}
              className="rounded-md bg-champagne px-5 py-2.5 text-sm font-semibold text-white hover:bg-champagne/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isImportingFromPath ? t('folderImport.importing') : t('folderImport.import')}
            </button>
            <div className="ml-auto max-w-full text-right text-[11px] text-gray-400">
              {serverPath ? (
                <span className="inline-block max-w-[340px] truncate align-middle">{serverPath}</span>
              ) : (
                <span>{t('folderImport.serverPlaceholder')}</span>
              )}
            </div>
          </div>
        </details>
        <p className="mt-1 text-center text-[11px] text-gray-400">
          {t('folderImport.advancedHint')}
        </p>

        {/* Browse server folders modal */}
        <Transition appear show={browseOpen} as={Fragment}>
          <Dialog as="div" className="relative z-50" onClose={() => setBrowseOpen(false)}>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black/30" />
            </Transition.Child>
            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4">
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-200"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                  leave="ease-in duration-150"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                >
                  <Dialog.Panel className="w-full max-w-lg rounded-xl bg-white p-4 shadow-xl">
                    <div className="flex items-center justify-between mb-3">
                      <Dialog.Title as="h3" className="text-lg font-semibold text-graphite">
                        Choose property folder on server
                      </Dialog.Title>
                      <button
                        type="button"
                        onClick={() => setBrowseOpen(false)}
                        className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-graphite"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>
                    {browseError && (
                      <p className="mb-3 text-sm text-red-600">{browseError}</p>
                    )}
                    <div className="mb-3 flex items-center gap-2">
                      {browseParentPath !== null && (
                        <button
                          type="button"
                          onClick={() => loadBrowse(browseParentPath)}
                          className="inline-flex items-center gap-1 rounded border border-gray-300 px-2 py-1 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <ChevronUpIcon className="h-4 w-4" />
                          Up
                        </button>
                      )}
                      {browseCurrentPath && (
                        <button
                          type="button"
                          onClick={() => selectBrowseFolder(browseCurrentPath)}
                          className="rounded bg-champagne px-3 py-1 text-sm font-medium text-white hover:bg-champagne/90"
                        >
                          Select this folder
                        </button>
                      )}
                    </div>
                    <p className="mb-2 truncate text-xs text-gray-500" title={browseCurrentPath || 'Select a location'}>
                      {browseCurrentPath || 'Select a location'}
                    </p>
                    {browseLoading ? (
                      <p className="py-4 text-center text-sm text-gray-500">Loading…</p>
                    ) : (
                      <ul className="max-h-64 space-y-1 overflow-y-auto rounded border border-gray-200 p-2">
                        {browseRoots.map((r) => (
                          <li key={r.path}>
                            <button
                              type="button"
                              onClick={() => loadBrowse(r.path)}
                              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-gray-100"
                            >
                              <FolderOpenIcon className="h-5 w-5 flex-shrink-0 text-champagne" />
                              {r.name}
                            </button>
                          </li>
                        ))}
                        {browseFolders.map((f) => (
                          <li key={f.path}>
                            <button
                              type="button"
                              onClick={() => loadBrowse(f.path)}
                              className="flex w-full min-w-0 items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-gray-100"
                            >
                              <FolderIcon className="h-5 w-5 flex-shrink-0 text-gray-500" />
                              <span className="truncate">{f.name}</span>
                            </button>
                          </li>
                        ))}
                        {!browseLoading && browseRoots.length === 0 && browseFolders.length === 0 && !browseError && (
                          <li className="py-2 text-center text-sm text-gray-500">No folders here</li>
                        )}
                      </ul>
                    )}
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>

        {importResults && (
          <div className="mt-6 space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-graphite mb-3">Import Results</h3>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <div className="text-2xl font-bold text-graphite">{importResults.total}</div>
                  <div className="text-sm text-gray-600">Total folders</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{importResults.successful}</div>
                  <div className="text-sm text-gray-600">Successful</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">{importResults.failed}</div>
                  <div className="text-sm text-gray-600">Errors</div>
                </div>
              </div>

              {importResults.success.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-green-700 mb-2 flex items-center">
                    <CheckCircleIcon className="h-5 w-5 mr-2" />
                    Successfully imported ({importResults.success.length})
                  </h4>
                  <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                    {importResults.success.map((name, idx) => (
                      <li key={idx}>{name}</li>
                    ))}
                  </ul>
                </div>
              )}

              {importResults.errors.length > 0 && (
                <div>
                  <h4 className="font-medium text-red-700 mb-2 flex items-center">
                    <XCircleIcon className="h-5 w-5 mr-2" />
                    Errors ({importResults.errors.length})
                  </h4>
                  <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                    {importResults.errors.map((error, idx) => (
                      <li key={idx}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

