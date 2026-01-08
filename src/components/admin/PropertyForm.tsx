import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { propertySchema, type PropertyFormData } from '@/lib/validations/property'
import { generateSlug } from '@/lib/utils/slug'
import ImageUpload from './ImageUpload'
import FileUpload, { type FileWithLabel } from './FileUpload'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface PropertyFormProps {
  property?: any
  onSave: (data: PropertyFormData & { images: string[]; files: FileWithLabel[] }) => Promise<void>
  onCancel: () => void
}

const PROPERTY_TYPES = [
  { value: 'APARTMENT', label: 'Apartment' },
  { value: 'VILLA', label: 'Villa' },
  { value: 'TOWNHOUSE', label: 'Townhouse' },
  { value: 'PENTHOUSE', label: 'Penthouse' },
  { value: 'STUDIO', label: 'Studio' },
  { value: 'OFFICE', label: 'Office' },
  { value: 'RETAIL', label: 'Retail' },
  { value: 'WAREHOUSE', label: 'Warehouse' },
  { value: 'LAND', label: 'Land' },
]

const PROPERTY_STATUSES = [
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'SOLD', label: 'Sold' },
  { value: 'RENTED', label: 'Rented' },
  { value: 'RESERVED', label: 'Reserved' },
  { value: 'UNAVAILABLE', label: 'Unavailable' },
]

export default function PropertyForm({ property, onSave, onCancel }: PropertyFormProps) {
  const [images, setImages] = useState<string[]>([])
  const [files, setFiles] = useState<FileWithLabel[]>([])
  const [areas, setAreas] = useState<any[]>([])
  const [developers, setDevelopers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [features, setFeatures] = useState<string[]>([])
  const [amenities, setAmenities] = useState<string[]>([])
  const [newFeature, setNewFeature] = useState('')
  const [newAmenity, setNewAmenity] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: property
      ? {
          title: property.title || '',
          description: property.description || '',
          type: property.type || 'APARTMENT',
          price: property.price || 0,
          currency: property.currency || 'AED',
          status: property.status || 'AVAILABLE',
          areaSqm: property.areaSqm || property.area || 0,
          bedrooms: property.bedrooms || 0,
          bathrooms: property.bathrooms || 0,
          parking: property.parking || undefined,
          floor: property.floor || undefined,
          totalFloors: property.totalFloors || undefined,
          yearBuilt: property.yearBuilt || undefined,
          completionDate: property.completionDate 
            ? (typeof property.completionDate === 'string' 
                ? property.completionDate 
                : new Date(property.completionDate).toISOString().split('T')[0])
            : undefined,
          address: property.address || '',
          city: property.city || '',
          district: property.district || '',
          areaId: property.areaId || '',
          developerId: property.developerId || undefined,
          coordinates: property.coordinates || undefined,
          features: property.features || [],
          amenities: property.amenities || [],
          slug: property.slug || '',
          metaTitle: property.metaTitle || undefined,
          metaDescription: property.metaDescription || undefined,
          isPublished: property.isPublished || false,
          isFeatured: property.isFeatured || false,
        }
      : {
          currency: 'AED',
          status: 'AVAILABLE',
          type: 'APARTMENT',
          features: [],
          amenities: [],
          isPublished: false,
          isFeatured: false,
        },
  })

  const title = watch('title')

  // Auto-generate slug from title
  useEffect(() => {
    if (title && !property) {
      const slug = generateSlug(title)
      setValue('slug', slug)
    }
  }, [title, property, setValue])

  // Load areas and developers
  useEffect(() => {
    const loadData = async () => {
      setLoadingData(true)
      try {
        const [areasRes, developersRes] = await Promise.all([
          fetch('/api/areas'),
          fetch('/api/developers'),
        ])

        if (!areasRes.ok || !developersRes.ok) {
          throw new Error('Failed to fetch data')
        }

        const areasData = await areasRes.json()
        const developersData = await developersRes.json()

        // Use API data only
        const loadedAreas = areasData.areas || []
        const loadedDevelopers = developersData.developers || []

        setAreas(loadedAreas)
        setDevelopers(loadedDevelopers)
      } catch (error) {
        console.error('Error loading data:', error)
        // No fallback - show empty lists
        setAreas([])
        setDevelopers([])
      } finally {
        setLoadingData(false)
      }
    }

    loadData()
  }, [])

  // Load property images and files if editing
  useEffect(() => {
    if (property) {
      // Load images
      if (property.images && Array.isArray(property.images) && property.images.length > 0) {
        const imageUrls = property.images.map((img: any) => {
          // Handle both object format {url: ...} and string format
          return typeof img === 'string' ? img : (img.url || img)
        })
        setImages(imageUrls)
      } else {
        // Reset images if property has no images
        setImages([])
      }
      
      // Load features and amenities
      setFeatures(property.features || [])
      setAmenities(property.amenities || [])
      
      // Load files
      if (property.files && Array.isArray(property.files) && property.files.length > 0) {
      setFiles(property.files.map((file: any) => ({
        id: file.id,
        label: file.label || '',
        file: null, // Файл уже загружен
        url: file.url,
        filename: file.filename,
        size: file.size,
        mimeType: file.mimeType,
      })))
      } else {
        // Reset files if property has no files
        setFiles([])
      }
    } else {
      // Reset when no property (creating new)
      setImages([])
      setFiles([])
      setFeatures([])
      setAmenities([])
    }
  }, [property])

  const onSubmit = async (data: PropertyFormData) => {
    setLoading(true)
    try {
      // Upload images/videos that haven't been uploaded yet (base64 strings)
      const uploadedImages = await Promise.all(
        images.map(async (image) => {
          // If image already has a URL (not base64), it's already uploaded
          if (image.startsWith('/uploads/') || image.startsWith('http')) {
            return image
          }

          // If it's base64, upload it
          if (image.startsWith('data:')) {
            try {
              // Determine file type and name
              const isVideo = image.startsWith('data:video/')
              const mimeType = image.split(';')[0].split(':')[1]
              const extension = isVideo 
                ? (mimeType.includes('mp4') ? '.mp4' : mimeType.includes('mov') ? '.mov' : '.mp4')
                : (mimeType.includes('webp') ? '.webp' : mimeType.includes('jpeg') ? '.jpg' : '.png')
              const filename = `image-${Date.now()}${extension}`

              // Upload image/video to server
              const uploadResponse = await fetch('/api/properties/upload-image', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  file: image,
                  filename,
                  mimeType,
                }),
              })

              if (!uploadResponse.ok) {
                throw new Error('Failed to upload image/video')
              }

              const uploadResult = await uploadResponse.json()
              return uploadResult.url
            } catch (error) {
              console.error('Error uploading image/video:', error)
              // Return original base64 if upload fails
              return image
            }
          }

          return image
        })
      )

      // Upload new files that haven't been uploaded yet
      const uploadedFiles = await Promise.all(
        files.map(async (fileItem) => {
          // If file already has a URL, it's already uploaded
          if (fileItem.url && !fileItem.file) {
            return fileItem
          }

          // If file needs to be uploaded
          if (fileItem.file) {
            try {
              // Convert file to base64
              const base64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader()
                reader.onload = () => {
                  const result = reader.result as string
                  resolve(result)
                }
                reader.onerror = reject
                reader.readAsDataURL(fileItem.file!)
              })

              // Upload file to server
              const uploadResponse = await fetch('/api/properties/upload-file', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  file: base64,
                  filename: fileItem.filename || fileItem.file.name,
                  mimeType: fileItem.mimeType || fileItem.file.type,
                }),
              })

              if (!uploadResponse.ok) {
                throw new Error('Failed to upload file')
              }

              const uploadResult = await uploadResponse.json()

              return {
                ...fileItem,
                url: uploadResult.url,
                file: null, // File is now uploaded
              }
            } catch (error) {
              console.error('Error uploading file:', error)
              // Return file item without URL if upload fails
              return fileItem
            }
          }

          return fileItem
        })
      )

      await onSave({
        ...data,
        images: uploadedImages,
        files: uploadedFiles,
      })
    } catch (error) {
      console.error('Error saving property:', error)
    } finally {
      setLoading(false)
    }
  }

  const addFeature = () => {
    if (newFeature.trim()) {
      setFeatures([...features, newFeature.trim()])
      setNewFeature('')
      setValue('features', [...features, newFeature.trim()])
    }
  }

  const removeFeature = (index: number) => {
    const newFeatures = features.filter((_, i) => i !== index)
    setFeatures(newFeatures)
    setValue('features', newFeatures)
  }

  const addAmenity = () => {
    if (newAmenity.trim()) {
      setAmenities([...amenities, newAmenity.trim()])
      setNewAmenity('')
      setValue('amenities', [...amenities, newAmenity.trim()])
    }
  }

  const removeAmenity = (index: number) => {
    const newAmenities = amenities.filter((_, i) => i !== index)
    setAmenities(newAmenities)
    setValue('amenities', newAmenities)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <div className="bg-gray-50 p-6 rounded-lg space-y-4">
        <h3 className="text-lg font-semibold text-graphite">Basic Information</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title *
          </label>
          <input
            type="text"
            {...register('title')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-champagne focus:border-champagne"
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description *
          </label>
          <textarea
            {...register('description')}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-champagne focus:border-champagne"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type *
            </label>
            <select
              {...register('type')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-champagne focus:border-champagne"
            >
              {PROPERTY_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status *
            </label>
            <select
              {...register('status')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-champagne focus:border-champagne"
            >
              {PROPERTY_STATUSES.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price *
            </label>
            <input
              type="number"
              step="0.01"
              {...register('price', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-champagne focus:border-champagne"
            />
            {errors.price && (
              <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Currency
            </label>
            <input
              type="text"
              {...register('currency')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-champagne focus:border-champagne"
            />
          </div>
        </div>
      </div>

      {/* Specifications */}
      <div className="bg-gray-50 p-6 rounded-lg space-y-4">
        <h3 className="text-lg font-semibold text-graphite">Specifications</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Area (sq ft) *
            </label>
            <input
              type="number"
              step="0.01"
              {...register('areaSqm', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-champagne focus:border-champagne"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bedrooms *
            </label>
            <input
              type="number"
              {...register('bedrooms', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-champagne focus:border-champagne"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bathrooms *
            </label>
            <input
              type="number"
              {...register('bathrooms', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-champagne focus:border-champagne"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Parking
            </label>
            <input
              type="number"
              {...register('parking', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-champagne focus:border-champagne"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Floor
            </label>
            <input
              type="number"
              {...register('floor', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-champagne focus:border-champagne"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Total Floors
            </label>
            <input
              type="number"
              {...register('totalFloors', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-champagne focus:border-champagne"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Year Built
            </label>
            <input
              type="number"
              {...register('yearBuilt', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-champagne focus:border-champagne"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Completion Date
            </label>
            <input
              type="date"
              {...register('completionDate')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-champagne focus:border-champagne"
            />
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="bg-gray-50 p-6 rounded-lg space-y-4">
        <h3 className="text-lg font-semibold text-graphite">Location</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Address *
          </label>
          <input
            type="text"
            {...register('address')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-champagne focus:border-champagne"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City *
            </label>
            <input
              type="text"
              {...register('city')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-champagne focus:border-champagne"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              District *
            </label>
            <input
              type="text"
              {...register('district')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-champagne focus:border-champagne"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Area (from list)
            </label>
            {loadingData ? (
              <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                Loading areas...
              </div>
            ) : (
              <>
                <select
                  {...register('areaId')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-champagne focus:border-champagne"
                >
                  <option value="">Select Area</option>
                  {areas.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.nameEn || area.name}
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Developer
            </label>
            {loadingData ? (
              <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                Loading developers...
              </div>
            ) : (
              <>
                <select
                  {...register('developerId')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-champagne focus:border-champagne"
                >
                  <option value="">Select Developer</option>
                  {developers.map((developer) => (
                    <option key={developer.id} value={developer.id}>
                      {developer.nameEn || developer.name}
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Images */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <ImageUpload
          images={images}
          onImagesChange={setImages}
          maxImages={30}
          label="Property Images & Videos"
        />
      </div>

      {/* Files for Download */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <FileUpload
          files={files}
          onFilesChange={setFiles}
          maxFiles={20}
          label="Files for Download"
        />
        <p className="mt-2 text-xs text-gray-500">
          Upload files (PDF, documents, etc.) with labels. Users will be able to download these files from the property page.
        </p>
      </div>

      {/* Features & Amenities */}
      <div className="bg-gray-50 p-6 rounded-lg space-y-4">
        <h3 className="text-lg font-semibold text-graphite">Features & Amenities</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Features
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newFeature}
              onChange={(e) => setNewFeature(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
              placeholder="Add feature"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-champagne focus:border-champagne"
            />
            <button
              type="button"
              onClick={addFeature}
              className="px-4 py-2 bg-champagne text-white rounded-md hover:bg-champagne/90"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {features.map((feature, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-3 py-1 bg-champagne/20 text-champagne rounded-full text-sm"
              >
                {feature}
                <button
                  type="button"
                  onClick={() => removeFeature(index)}
                  className="text-champagne hover:text-red-600"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </span>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amenities
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newAmenity}
              onChange={(e) => setNewAmenity(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAmenity())}
              placeholder="Add amenity"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-champagne focus:border-champagne"
            />
            <button
              type="button"
              onClick={addAmenity}
              className="px-4 py-2 bg-champagne text-white rounded-md hover:bg-champagne/90"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {amenities.map((amenity, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-3 py-1 bg-champagne/20 text-champagne rounded-full text-sm"
              >
                {amenity}
                <button
                  type="button"
                  onClick={() => removeAmenity(index)}
                  className="text-champagne hover:text-red-600"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* SEO */}
      <div className="bg-gray-50 p-6 rounded-lg space-y-4">
        <h3 className="text-lg font-semibold text-graphite">SEO</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Slug *
          </label>
          <input
            type="text"
            {...register('slug')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-champagne focus:border-champagne"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Meta Title
          </label>
          <input
            type="text"
            {...register('metaTitle')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-champagne focus:border-champagne"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Meta Description
          </label>
          <textarea
            {...register('metaDescription')}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-champagne focus:border-champagne"
          />
        </div>
      </div>

      {/* Flags */}
      <div className="bg-gray-50 p-6 rounded-lg space-y-4">
        <h3 className="text-lg font-semibold text-graphite">Settings</h3>
        
        <div className="flex items-center gap-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              {...register('isPublished')}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">Published</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              {...register('isFeatured')}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">Featured</span>
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-4 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-champagne text-white rounded-md hover:bg-champagne/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : property ? 'Update Property' : 'Create Property'}
        </button>
      </div>
    </form>
  )
}

