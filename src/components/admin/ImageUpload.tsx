import { useState, useRef } from 'react'
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface ImageData {
  full: string // Full size image (base64 or URL)
  thumbnail?: string // Thumbnail for preview (base64)
}

interface ImageUploadProps {
  images: string[]
  onImagesChange: (images: string[]) => void
  maxImages?: number
  label?: string
}

// Function to convert image to WebP format
const convertToWebP = async (file: File, quality: number = 0.85, maxSize: number = 1600): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const img = new Image()
      
      img.onload = () => {
        // Create canvas
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'))
          return
        }
        
        // Set canvas dimensions (optionally resize for optimization)
        const maxWidth = maxSize
        const maxHeight = maxSize
        let width = img.width
        let height = img.height
        
        // Resize if image is too large
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width = width * ratio
          height = height * ratio
        }
        
        canvas.width = width
        canvas.height = height
        
        // Draw image on canvas
        ctx.drawImage(img, 0, 0, width, height)
        
        // Convert to WebP
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to convert to WebP'))
              return
            }
            
            // Convert blob to base64
            const reader = new FileReader()
            reader.onload = () => {
              resolve(reader.result as string)
            }
            reader.onerror = reject
            reader.readAsDataURL(blob)
          },
          'image/webp',
          quality
        )
      }
      
      img.onerror = reject
      img.src = e.target?.result as string
    }
    
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// Function to generate thumbnail (small preview)
const generateThumbnail = async (file: File, size: number = 200, quality: number = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const img = new Image()
      
      img.onload = () => {
        // Create canvas for thumbnail
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'))
          return
        }
        
        // Calculate thumbnail dimensions maintaining aspect ratio
        let width = img.width
        let height = img.height
        
        if (width > height) {
          if (width > size) {
            height = (height / width) * size
            width = size
          }
        } else {
          if (height > size) {
            width = (width / height) * size
            height = size
          }
        }
        
        canvas.width = width
        canvas.height = height
        
        // Draw image on canvas
        ctx.drawImage(img, 0, 0, width, height)
        
        // Convert to WebP
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to convert thumbnail to WebP'))
              return
            }
            
            // Convert blob to base64
            const reader = new FileReader()
            reader.onload = () => {
              resolve(reader.result as string)
            }
            reader.onerror = reject
            reader.readAsDataURL(blob)
          },
          'image/webp',
          quality
        )
      }
      
      img.onerror = reject
      img.src = e.target?.result as string
    }
    
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function ImageUpload({
  images,
  onImagesChange,
  maxImages = 30,
  label = 'Images',
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    if (images.length + files.length > maxImages) {
      alert(`Maximum ${maxImages} images/videos allowed`)
      return
    }

    setUploading(true)

    try {
      const newImages: string[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        
        // Handle video files
        if (file.type.startsWith('video/')) {
          const reader = new FileReader()
          const base64 = await new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string)
            reader.onerror = reject
            reader.readAsDataURL(file)
          })
          newImages.push(base64)
        } else {
        // Convert image to WebP format
        try {
          const webpBase64 = await convertToWebP(file)
          newImages.push(webpBase64)
        } catch (error) {
          console.error(`Error converting image ${file.name} to WebP:`, error)
          // Fallback to original format if WebP conversion fails
          const reader = new FileReader()
          const base64 = await new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string)
            reader.onerror = reject
            reader.readAsDataURL(file)
          })
          newImages.push(base64)
          }
        }
      }

      onImagesChange([...images, ...newImages])
    } catch (error) {
      console.error('Error uploading images/videos:', error)
      alert('Error uploading images/videos')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    onImagesChange(newImages)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const files = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith('image/') || file.type.startsWith('video/')
    )

    if (files.length === 0) return

    if (images.length + files.length > maxImages) {
      alert(`Maximum ${maxImages} images/videos allowed`)
      return
    }

    setUploading(true)

    try {
      const newImages: string[] = []

      for (const file of files) {
        // Handle video files
        if (file.type.startsWith('video/')) {
          const reader = new FileReader()
          const base64 = await new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string)
            reader.onerror = reject
            reader.readAsDataURL(file)
          })
          newImages.push(base64)
        } else {
        // Convert image to WebP format
        try {
          const webpBase64 = await convertToWebP(file)
          newImages.push(webpBase64)
        } catch (error) {
          console.error(`Error converting image ${file.name} to WebP:`, error)
          // Fallback to original format if WebP conversion fails
          const reader = new FileReader()
          const base64 = await new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string)
            reader.onerror = reject
            reader.readAsDataURL(file)
          })
          newImages.push(base64)
          }
        }
      }

      onImagesChange([...images, ...newImages])
    } catch (error) {
      console.error('Error uploading images/videos:', error)
      alert('Error uploading images/videos')
    } finally {
      setUploading(false)
    }
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
          accept="image/*,video/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading || images.length >= maxImages}
        />
        <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
        <div className="mt-4">
          <span className="text-sm font-medium text-champagne">
            {uploading ? 'Uploading...' : 'Click to upload or drag and drop'}
          </span>
          <p className="text-xs text-gray-500 mt-1">
            Images (PNG, JPG, GIF) and Videos (MP4, MOV) up to 50MB each - images automatically converted to WebP ({images.length}/{maxImages} items)
          </p>
        </div>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {images.map((image, index) => {
            const isVideo = image.startsWith('data:video/')
            // For preview, use thumbnail if available, otherwise use full image
            // Images are stored as base64 strings, so we use them directly
            // But we can optimize display by using object-cover and fixed size
            return (
            <div key={index} className="relative group">
                {isVideo ? (
                  <video
                    src={image}
                    className="w-full h-32 object-cover rounded-lg"
                    controls={false}
                    muted
                    preload="metadata"
                  />
                ) : (
              <img
                src={image}
                alt={`Upload ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg"
                    loading="lazy"
                    style={{ maxWidth: '100%', height: '128px', objectFit: 'cover' }}
              />
                )}
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
              {index === 0 && (
                <span className="absolute bottom-2 left-2 bg-champagne text-white text-xs px-2 py-1 rounded">
                  Main
                </span>
              )}
                {isVideo && (
                  <span className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                    Video
                  </span>
                )}
            </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

