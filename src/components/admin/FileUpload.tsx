import { useState, useRef } from 'react'
import { DocumentIcon, XMarkIcon, PaperClipIcon } from '@heroicons/react/24/outline'

export interface FileWithLabel {
  id: string
  label: string
  file: File | null
  url?: string // For existing files
  filename?: string
  size?: number
  mimeType?: string
}

interface FileUploadProps {
  files: FileWithLabel[]
  onFilesChange: (files: FileWithLabel[]) => void
  maxFiles?: number
  label?: string
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

export default function FileUpload({
  files,
  onFilesChange,
  maxFiles = 20,
  label = 'Files for Download',
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (!selectedFiles || selectedFiles.length === 0) return

    if (files.length + selectedFiles.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`)
      return
    }

    const newFiles: FileWithLabel[] = Array.from(selectedFiles).map((file) => ({
      id: `file-${Date.now()}-${Math.random()}`,
      label: '', // User will need to enter label
      file,
      filename: file.name,
      size: file.size,
      mimeType: file.type,
    }))

    onFilesChange([...files, ...newFiles])
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeFile = (id: string) => {
    const newFiles = files.filter((f) => f.id !== id)
    onFilesChange(newFiles)
  }

  const updateLabel = (id: string, label: string) => {
    const newFiles = files.map((f) => (f.id === id ? { ...f, label } : f))
    onFilesChange(newFiles)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const droppedFiles = Array.from(e.dataTransfer.files)

    if (droppedFiles.length === 0) return

    if (files.length + droppedFiles.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`)
      return
    }

    const newFiles: FileWithLabel[] = droppedFiles.map((file) => ({
      id: `file-${Date.now()}-${Math.random()}`,
      label: '',
      file,
      filename: file.name,
      size: file.size,
      mimeType: file.type,
    }))

    onFilesChange([...files, ...newFiles])
  }

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-champagne transition-colors cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading || files.length >= maxFiles}
        />
        <PaperClipIcon className="mx-auto h-12 w-12 text-gray-400" />
        <div className="mt-4">
          <span className="text-sm font-medium text-champagne">
            {uploading ? 'Uploading...' : 'Click to upload or drag and drop'}
          </span>
          <p className="text-xs text-gray-500 mt-1">
            PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX and other files ({files.length}/{maxFiles} files)
          </p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-3">
          {files.map((fileItem) => (
            <div
              key={fileItem.id}
              className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex-shrink-0 mt-1">
                <DocumentIcon className="h-8 w-8 text-gray-400" />
              </div>
              
              <div className="flex-1 space-y-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    File Label (e.g., "Floor Plan", "Brochure", "Price List")
                  </label>
                  <input
                    type="text"
                    value={fileItem.label}
                    onChange={(e) => updateLabel(fileItem.id, e.target.value)}
                    placeholder="Enter file label..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-champagne focus:border-champagne"
                  />
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="font-medium">{fileItem.filename || fileItem.url?.split('/').pop()}</span>
                  {fileItem.size && (
                    <span className="text-gray-400">({formatFileSize(fileItem.size)})</span>
                  )}
                  {fileItem.mimeType && (
                    <span className="text-xs text-gray-400">• {fileItem.mimeType}</span>
                  )}
                </div>
              </div>
              
              <button
                type="button"
                onClick={() => removeFile(fileItem.id)}
                className="flex-shrink-0 p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                title="Remove file"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

