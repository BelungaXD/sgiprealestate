import { useState, useRef } from 'react'
import { FolderIcon, CheckCircleIcon, XCircleIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline'

interface FolderImportProps {
  onImportComplete: () => void
}

interface FileWithPath extends File {
  webkitRelativePath?: string
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

  const handleFolderSelect = (files: FileList | null) => {
    if (!files || files.length === 0) {
      alert('Не выбраны файлы')
      return
    }

    // Получаем имя папки из первого файла
    const firstFile = files[0] as FileWithPath
    const relativePath = firstFile.webkitRelativePath || ''
    const folderName = relativePath.split('/')[0] || 'Выбранная папка'
    
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

    // При drag & drop нужно использовать input для выбора папки
    // Браузер не предоставляет webkitRelativePath при drag & drop
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const processFiles = async (files: FileList) => {
    setIsImporting(true)
    setImportResults(null)

    try {
      // Создаем FormData для загрузки файлов
      const formData = new FormData()
      
      // Добавляем все файлы с сохранением относительного пути
      Array.from(files).forEach((file) => {
        const fileWithPath = file as FileWithPath
        // Сохраняем webkitRelativePath в имени файла для передачи на сервер
        if (fileWithPath.webkitRelativePath) {
          // Используем webkitRelativePath как имя для сохранения структуры папок
          formData.append('files', file, fileWithPath.webkitRelativePath)
        } else {
          formData.append('files', file)
        }
      })

      console.log('Uploading files:', Array.from(files).length)

      const response = await fetch('/api/properties/import-folder-files', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Server error:', errorText)
        throw new Error(`Server error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log('Import response:', data)

      if (!response.ok) {
        throw new Error(data.message || 'Ошибка импорта')
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
      const errorMessage = error.message || 'Неизвестная ошибка при импорте'
      alert(`Ошибка импорта: ${errorMessage}`)
      setImportResults({
        success: [],
        errors: [errorMessage],
        total: 0,
        successful: 0,
        failed: 1,
      })
    } finally {
      setIsImporting(false)
      // Сбросить input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center space-x-3 mb-6">
        <FolderIcon className="h-6 w-6 text-champagne" />
        <h2 className="text-xl font-semibold text-graphite">Автоматический импорт из папки</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Выберите папку с объектами недвижимости
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
              webkitdirectory=""
              directory=""
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
                  <p className="text-lg font-medium text-graphite mb-2">Импорт в процессе...</p>
                  <p className="text-sm text-gray-500">Пожалуйста, подождите</p>
                </>
              ) : (
                <>
                  <ArrowUpTrayIcon className={`h-12 w-12 mb-4 ${isDragging ? 'text-champagne' : 'text-gray-400'}`} />
                  <p className="text-lg font-medium text-graphite mb-2">
                    {selectedFolder || 'Перетащите папку сюда или нажмите для выбора'}
                  </p>
                  <p className="text-sm text-gray-500">
                    Выберите любую папку. Система автоматически найдет все объекты недвижимости внутри.
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    Поддерживаемые районы: Beachfront, Downtown, Dubai Hills, Marina Shores, The Oasis
                    <br />
                    Структура может быть любой: папка → район → объект или папка → объект
                  </p>
                </>
              )}
            </div>
          </div>

          {selectedFolder && !isImporting && (
            <div className="mt-2 text-sm text-green-600">
              ✓ Выбрана папка: <strong>{selectedFolder}</strong>
            </div>
          )}
        </div>

        {importResults && (
          <div className="mt-6 space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-graphite mb-3">Результаты импорта</h3>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <div className="text-2xl font-bold text-graphite">{importResults.total}</div>
                  <div className="text-sm text-gray-600">Всего папок</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{importResults.successful}</div>
                  <div className="text-sm text-gray-600">Успешно</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">{importResults.failed}</div>
                  <div className="text-sm text-gray-600">Ошибок</div>
                </div>
              </div>

              {importResults.success.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-green-700 mb-2 flex items-center">
                    <CheckCircleIcon className="h-5 w-5 mr-2" />
                    Успешно импортировано ({importResults.success.length})
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
                    Ошибки ({importResults.errors.length})
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

