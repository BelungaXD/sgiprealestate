import { useState, useRef, useCallback } from 'react'
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
  onImportComplete: () => void
}

// FileWithPath interface - extends File with optional path properties
// Note: webkitRelativePath is already in File type, but we make it explicitly optional
interface FileWithPath {
  name: string
  size: number
  type: string
  lastModified: number
  webkitRelativePath?: string
  path?: string
  [key: string]: any
}

export default function FolderImport({ onImportComplete }: FolderImportProps) {
  const [isImporting, setIsImporting] = useState(false)
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

  const handleImportFromServerPath = async () => {
    const path = serverPath.trim()
    if (!path) {
      alert('Enter server path to folder containing property subfolders (e.g. /uploads or /uploads/PropertyName)')
      return
    }
    if (isImportingFromPath) return
    setIsImportingFromPath(true)
    setImportResults(null)

    try {
      const response = await fetch('/api/properties/import-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderPath: path }),
      })
      const contentType = response.headers.get('content-type')
      let data: { results?: { success?: string[]; errors?: string[] }; total?: number; successful?: number; failed?: number; error?: string; message?: string } = {}
      try {
        const text = await response.text()
        const isHtml = text && (text.trimStart().toLowerCase().startsWith('<!') || text.includes('<html'))
        if (text && contentType?.includes('application/json') && !isHtml) {
          data = JSON.parse(text) as typeof data
        } else if (isHtml || (!response.ok && text)) {
          const msg = isHtml
            ? `Server error ${response.status}: Import may have timed out or the API returned an error page. Check container logs: docker logs sgiprealestate-service-green`
            : text.slice(0, 200)
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
        onImportComplete()
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Import failed'
      alert(`Import error: ${errorMessage}`)
      setImportResults({
        success: [],
        errors: [errorMessage],
        total: 0,
        successful: 0,
        failed: 1,
      })
    } finally {
      setIsImportingFromPath(false)
    }
  }

  const handleFolderSelect = (files: FileList | null) => {
    if (!files || files.length === 0) {
      alert('No files selected')
      return
    }

    // Get folder name from first file
    const firstFile = files[0] as FileWithPath
    const relativePath = firstFile.webkitRelativePath || ''
    const folderName = relativePath.split('/')[0] || 'Selected folder'
    
    console.log('Selected folder:', folderName)
    console.log('Total files:', files.length)
    console.log('First file path:', relativePath)
    
    setSelectedFolder(folderName)
    processFiles(files)
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    // For drag & drop we need to use input for folder selection
    // Browser doesn't provide webkitRelativePath with drag & drop
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const processFiles = async (files: FileList) => {
    if (isProcessingRef.current) return
    isProcessingRef.current = true
    setIsImporting(true)
    setImportResults(null)

    try {
      const filesArray = Array.from(files)

      const MAX_TOTAL_SIZE = 10 * 1024 * 1024 * 1024 // 10GB
      let totalSize = 0
      filesArray.forEach((file) => { totalSize += file.size })

      if (totalSize > MAX_TOTAL_SIZE) {
        const sizeInGB = (totalSize / (1024 * 1024 * 1024)).toFixed(2)
        throw new Error(`Общий размер файлов (${sizeInGB}GB) превышает максимальный лимит (10GB). Попробуйте загрузить папки по отдельности.`)
      }

      const formData = new FormData()
      filesArray.forEach((file) => {
        const fileWithPath = file as FileWithPath
        if (fileWithPath.webkitRelativePath) {
          formData.append('files', file, fileWithPath.webkitRelativePath)
        } else {
          formData.append('files', file)
        }
      })

      console.log('Phase 1: Uploading folder:', filesArray.length, `Total size: ${(totalSize / (1024 * 1024 * 1024)).toFixed(2)}GB`)

      // Phase 1: upload folder to server (uploads/incoming/), no DB import
      const uploadResponse = await fetch('/api/properties/upload-folder', {
        method: 'POST',
        body: formData,
        redirect: 'manual',
      })

      if (uploadResponse.type === 'opaqueredirect' || (uploadResponse.status >= 300 && uploadResponse.status < 400)) {
        throw new Error('Request was redirected. Ensure you use https://sgipreal.com (not http) and are not behind a proxy that redirects.')
      }

      if (!uploadResponse.ok) {
        let errorMessage = `Server error: ${uploadResponse.status} ${uploadResponse.statusText}`
        if (uploadResponse.status === 413) {
          try {
            const errorData = await uploadResponse.json()
            errorMessage = errorData.error || errorData.message || 'Размер загружаемых файлов превышает лимит сервера. Попробуйте загрузить папки по отдельности.'
          } catch {
            errorMessage = 'Размер загружаемых файлов превышает лимит сервера (413 Payload Too Large). Максимальный размер: 10GB.'
          }
        } else {
          try {
            const errorData = await uploadResponse.json()
            errorMessage = errorData.error || errorData.message || errorMessage
          } catch {
            const errorText = await uploadResponse.text()
            if (errorText) console.error('Server error:', errorText)
          }
        }
        throw new Error(errorMessage)
      }

      const uploadData = await uploadResponse.json()
      const folderPath = uploadData.folderPath
      if (!folderPath || typeof folderPath !== 'string') {
        throw new Error('Upload succeeded but server did not return folder path')
      }

      console.log('Phase 2: Importing from uploaded folder:', folderPath)

      // Phase 2: import from uploaded folder and create property in DB
      const importResponse = await fetch('/api/properties/import-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderPath }),
      })

      const contentType = importResponse.headers.get('content-type')
      let data: { results?: { success?: string[]; errors?: string[] }; total?: number; successful?: number; failed?: number; error?: string; message?: string } = {}
      const text = await importResponse.text()
      const isHtml = text && (text.trimStart().toLowerCase().startsWith('<!') || text.includes('<html'))
      if (text && contentType?.includes('application/json') && !isHtml) {
        data = JSON.parse(text) as typeof data
      } else if (isHtml || (!importResponse.ok && text)) {
        const msg = isHtml
          ? `Import failed (${importResponse.status}). Check container logs.`
          : text.slice(0, 200)
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
        onImportComplete()
      }
    } catch (error: any) {
      console.error('Upload/import error:', error)
      const errorMessage = error.message || 'Unknown error'
      // If upload succeeded but import failed, data is still in uploads/ – user can re-import from server path
      alert(`Error: ${errorMessage}`)
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
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div>
      <div className="flex items-center space-x-3 mb-6">
        <FolderIcon className="h-6 w-6 text-champagne" />
        <h2 className="text-xl font-semibold text-graphite">Automatic Folder Import</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select folder with property objects
          </label>
          
          {/* Drag & Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
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
              {...({ webkitdirectory: '' } as any)}
              {...({ directory: '' } as any)}
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
                  <p className="text-lg font-medium text-graphite mb-2">Import in progress...</p>
                  <p className="text-sm text-gray-500">Please wait</p>
                </>
              ) : (
                <>
                  <ArrowUpTrayIcon className={`h-12 w-12 mb-4 ${isDragging ? 'text-champagne' : 'text-gray-400'}`} />
                  <p className="text-lg font-medium text-graphite mb-2">
                    {selectedFolder || 'Drag folder here or click to select'}
                  </p>
                  <p className="text-sm text-gray-500">
                    Select any folder. The system will automatically find all property objects inside.
                  </p>
                  <p className="text-xs text-champagne mt-2 font-medium">
                    Drag & drop is preferable
                  </p>
                </>
              )}
            </div>
          </div>

          {selectedFolder && !isImporting && (
            <div className="mt-2 text-sm text-green-600">
              ✓ Selected folder: <strong>{selectedFolder}</strong>
            </div>
          )}
        </div>

        {/* Import from server path - no upload, files already on disk */}
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <ServerStackIcon className="h-5 w-5 text-champagne" />
            Or import from server (no upload)
          </h3>
          <p className="text-xs text-gray-500 mb-2">
            Choose a property folder already on the server (e.g. after scp/rsync or a previous upload). Use Browse to pick from disk.
          </p>
          <div className="flex gap-2 flex-wrap">
            <input
              type="text"
              value={serverPath}
              onChange={(e) => setServerPath(e.target.value)}
              placeholder="Choose folder with Browse or enter path"
              className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-champagne focus:border-champagne"
              disabled={isImporting || isImportingFromPath}
            />
            <button
              type="button"
              onClick={openBrowse}
              disabled={isImporting || isImportingFromPath}
              className="inline-flex items-center gap-2 px-4 py-2 border border-champagne text-champagne rounded-md text-sm font-medium hover:bg-champagne/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FolderOpenIcon className="h-5 w-5" />
              Browse
            </button>
            <button
              type="button"
              onClick={handleImportFromServerPath}
              disabled={isImporting || isImportingFromPath || !serverPath.trim()}
              className="px-4 py-2 bg-champagne text-white rounded-md text-sm font-medium hover:bg-champagne/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isImportingFromPath ? 'Importing...' : 'Import'}
            </button>
          </div>
        </div>

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
                              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-gray-100"
                            >
                              <FolderIcon className="h-5 w-5 flex-shrink-0 text-gray-500" />
                              {f.name}
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

