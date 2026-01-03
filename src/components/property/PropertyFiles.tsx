import { useTranslation } from 'next-i18next'
import { DocumentIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'

interface PropertyFile {
  id: string
  label: string
  url: string
  filename: string
  size?: number | null
  mimeType?: string | null
}

interface PropertyFilesProps {
  files: PropertyFile[]
}

const formatFileSize = (bytes: number | null | undefined): string => {
  if (!bytes || bytes === 0) return 'Unknown size'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

const getFileIcon = (mimeType: string | null | undefined) => {
  if (!mimeType) return DocumentIcon
  
  if (mimeType.includes('pdf')) {
    return DocumentIcon
  } else if (mimeType.includes('image')) {
    return DocumentIcon
  } else if (mimeType.includes('video')) {
    return DocumentIcon
  }
  
  return DocumentIcon
}

export default function PropertyFiles({ files }: PropertyFilesProps) {
  const { t } = useTranslation('property')

  if (!files || files.length === 0) {
    return (
      <div className="text-center py-12">
        <DocumentIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-500">{t('files.noFiles', 'No files available for download')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-2xl font-semibold text-graphite mb-6">
          {t('files.title', 'Documents & Files')}
        </h3>
        <p className="text-gray-600 mb-6">
          {t('files.description', 'Download brochures, floor plans, payment plans, and other documents related to this property.')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {files.map((file) => {
          const FileIcon = getFileIcon(file.mimeType)
          const isVideo = file.mimeType?.startsWith('video/')
          
          return (
            <a
              key={file.id}
              href={file.url}
              download
              className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-champagne hover:bg-champagne/5 transition-all group"
            >
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-champagne/10 rounded-lg flex items-center justify-center group-hover:bg-champagne/20 transition-colors">
                  <FileIcon className="h-6 w-6 text-champagne" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="font-medium text-graphite group-hover:text-champagne transition-colors truncate">
                  {file.label || file.filename}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                  {file.size && (
                    <span>{formatFileSize(file.size)}</span>
                  )}
                  {file.mimeType && !isVideo && (
                    <>
                      <span>•</span>
                      <span className="uppercase">{file.mimeType.split('/')[1] || 'File'}</span>
                    </>
                  )}
                  {isVideo && (
                    <>
                      <span>•</span>
                      <span>Video</span>
                    </>
                  )}
                </div>
              </div>
              
              <div className="flex-shrink-0">
                <ArrowDownTrayIcon className="h-5 w-5 text-gray-400 group-hover:text-champagne transition-colors" />
              </div>
            </a>
          )
        })}
      </div>
    </div>
  )
}

