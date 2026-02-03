import { useState, useRef } from 'react'
import { FolderIcon, CheckCircleIcon, XCircleIcon, ArrowUpTrayIcon, ServerStackIcon } from '@heroicons/react/24/outline'

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
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.message || `Server error: ${response.status}`)
      }

      setImportResults({
        success: data.results?.success || [],
        errors: data.results?.errors || [],
        total: data.total || 0,
        successful: data.successful || 0,
        failed: data.failed || 0,
      })
      if (data.successful > 0) {
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
      // Copy to array immediately - FileList can become invalid
      const filesArray = Array.from(files)

      // Проверяем общий размер файлов перед отправкой (максимум 10GB)
      const MAX_TOTAL_SIZE = 10 * 1024 * 1024 * 1024 // 10GB
      let totalSize = 0
      filesArray.forEach((file) => { totalSize += file.size })

      if (totalSize > MAX_TOTAL_SIZE) {
        const sizeInGB = (totalSize / (1024 * 1024 * 1024)).toFixed(2)
        throw new Error(`Общий размер файлов (${sizeInGB}GB) превышает максимальный лимит (10GB). Попробуйте загрузить папки по отдельности.`)
      }

      // Create FormData for file upload
      const formData = new FormData()
      filesArray.forEach((file) => {
        const fileWithPath = file as FileWithPath
        if (fileWithPath.webkitRelativePath) {
          formData.append('files', file, fileWithPath.webkitRelativePath)
        } else {
          formData.append('files', file)
        }
      })

      console.log('Uploading files:', filesArray.length, `Total size: ${(totalSize / (1024 * 1024 * 1024)).toFixed(2)}GB`)

      // redirect: 'manual' - prevents "Body is disturbed or locked" when a redirect occurs during POST
      const response = await fetch('/api/properties/import-folder-files', {
        method: 'POST',
        body: formData,
        redirect: 'manual',
      })

      // Handle redirect (causes "Body is disturbed or locked" if we followed it)
      if (response.type === 'opaqueredirect' || (response.status >= 300 && response.status < 400)) {
        throw new Error('Request was redirected. Ensure you use https://sgipreal.com (not http) and are not behind a proxy that redirects.')
      }

      if (!response.ok) {
        let errorMessage = `Server error: ${response.status} ${response.statusText}`
        
        // Специальная обработка ошибки 413 (Payload Too Large)
        if (response.status === 413) {
          try {
            const errorData = await response.json()
            errorMessage = errorData.error || errorData.message || 'Размер загружаемых файлов превышает лимит сервера. Попробуйте загрузить папки по отдельности.'
          } catch {
            errorMessage = 'Размер загружаемых файлов превышает лимит сервера (413 Payload Too Large). Максимальный размер: 10GB. Попробуйте загрузить папки по отдельности.'
          }
        } else {
          try {
            const errorData = await response.json()
            errorMessage = errorData.error || errorData.message || errorMessage
          } catch {
            const errorText = await response.text()
            if (errorText) {
              console.error('Server error:', errorText)
            }
          }
        }
        
        throw new Error(errorMessage)
      }

      const data = await response.json()
      console.log('Import response:', data)

      if (!response.ok) {
        throw new Error(data.message || 'Import error')
      }

      setImportResults({
        success: data.results?.success || [],
        errors: data.results?.errors || [],
        total: data.total || 0,
        successful: data.successful || 0,
        failed: data.failed || 0,
      })

      if (data.successful > 0) {
        onImportComplete()
      }
    } catch (error: any) {
      console.error('Import error:', error)
      const errorMessage = error.message || 'Unknown import error'
      alert(`Import error: ${errorMessage}`)
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
            Or import from server path (no upload)
          </h3>
          <p className="text-xs text-gray-500 mb-2">
            Use when files are already on the server (scp/rsync). Path: parent folder with subfolders, or direct property folder with files.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={serverPath}
              onChange={(e) => setServerPath(e.target.value)}
              placeholder="/uploads or /uploads/Creek Vistas Reserve"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-champagne focus:border-champagne"
              disabled={isImporting || isImportingFromPath}
            />
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

