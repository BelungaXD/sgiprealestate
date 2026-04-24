import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  propertySchema,
  type PropertyFormData,
  type PropertyFormInput,
} from '@/lib/validations/property'
import { getErrorMessage } from '@/lib/utils/errorMessage'
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

const BEDROOM_OPTIONS = [
  { value: 0, label: 'Studio' },
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
  { value: 4, label: '4' },
  { value: 5, label: '5+' },
]

type AreaOpt = { id: string; name: string; nameEn: string | null; slug: string }

export default function PropertyForm({ property, onSave, onCancel }: PropertyFormProps) {
  const [images, setImages] = useState<string[]>([])
  const [files, setFiles] = useState<FileWithLabel[]>([])
  const [developers, setDevelopers] = useState<any[]>([])
  const [areas, setAreas] = useState<AreaOpt[]>([])
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
  } = useForm<PropertyFormInput, unknown, PropertyFormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: property
      ? {
          title: property.title || '',
          description: property.description || '',
          type: property.type || 'APARTMENT',
          listingMarket: property.listingMarket || 'PRIMARY',
          price: property.price || 0,
          currency: property.currency || 'AED',
          status: property.status || 'AVAILABLE',
          areaSqm: property.areaSqm || property.area || 0,
          bedrooms: property.bedrooms ?? 0,
          bathrooms: property.bathrooms || 0,
          parking: property.parking || undefined,
          floor: property.floor || undefined,
          totalFloors: property.totalFloors || undefined,
          yearBuilt: property.yearBuilt || undefined,
          completionDate: property.completionDate
            ? typeof property.completionDate === 'string'
              ? property.completionDate
              : new Date(property.completionDate).toISOString().split('T')[0]
            : undefined,
          paymentPlan: property.paymentPlan || '',
          occupancyStatus: property.occupancyStatus || undefined,
          address: property.address || '',
          city: property.city || '',
          district: property.district || '',
          areaId: property.areaId || '',
          developerId: property.developerId || '',
          googleMapsUrl: property.googleMapsUrl || '',
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
          listingMarket: 'PRIMARY',
          bedrooms: 1,
          bathrooms: 1,
          features: [],
          amenities: [],
          isPublished: false,
          isFeatured: false,
          googleMapsUrl: '',
        },
  })

  const title = watch('title')
  const listingMarket = watch('listingMarket')

  useEffect(() => {
    if (title && !property) {
      setValue('slug', generateSlug(title))
    }
  }, [title, property, setValue])

  useEffect(() => {
    if (listingMarket === 'SECONDARY') {
      setValue('developerId', '')
    } else {
      setValue('occupancyStatus', undefined)
    }
  }, [listingMarket, setValue])

  const loadLookup = async () => {
    setLoadingData(true)
    try {
      const [devResult, areaResult] = await Promise.allSettled([
        fetch('/api/developers?admin=1'),
        fetch('/api/areas?admin=1'),
      ])

      if (devResult.status === 'fulfilled') {
        if (!devResult.value.ok) {
          console.error(
            `[${new Date().toISOString()}] Failed to load developers for admin form`,
            { status: devResult.value.status }
          )
          setDevelopers([])
        } else {
          const devData = await devResult.value.json()
          setDevelopers(devData.developers || [])
        }
      } else {
        console.error(
          `[${new Date().toISOString()}] Developers lookup request failed`,
          devResult.reason
        )
        setDevelopers([])
      }

      if (areaResult.status === 'fulfilled') {
        if (!areaResult.value.ok) {
          console.error(
            `[${new Date().toISOString()}] Failed to load areas for admin form`,
            { status: areaResult.value.status }
          )
          setAreas([])
        } else {
          const areaData = await areaResult.value.json()
          setAreas(areaData.areas || [])
        }
      } else {
        console.error(
          `[${new Date().toISOString()}] Areas lookup request failed`,
          areaResult.reason
        )
        setAreas([])
      }
    } catch (e) {
      console.error(`[${new Date().toISOString()}] Unexpected lookup error`, e)
      setDevelopers([])
      setAreas([])
    } finally {
      setLoadingData(false)
    }
  }

  useEffect(() => {
    loadLookup()
  }, [])

  useEffect(() => {
    if (property) {
      if (property.images && Array.isArray(property.images) && property.images.length > 0) {
        setImages(
          property.images.map((img: any) =>
            typeof img === 'string' ? img : img.url || img
          )
        )
      } else {
        setImages([])
      }
      setFeatures(property.features || [])
      setAmenities(property.amenities || [])
      if (property.files && Array.isArray(property.files) && property.files.length > 0) {
        setFiles(
          property.files.map((file: any) => ({
            id: file.id,
            label: file.label || '',
            file: null,
            url: file.url,
            filename: file.filename,
            size: file.size,
            mimeType: file.mimeType,
          }))
        )
      } else {
        setFiles([])
      }
    } else {
      setImages([])
      setFiles([])
      setFeatures([])
      setAmenities([])
    }
  }, [property])

  const onSubmit = async (data: PropertyFormData) => {
    setLoading(true)
    try {
      const uploadedImages = await Promise.all(
        images.map(async (image) => {
          if (image.startsWith('/uploads/') || image.startsWith('http')) {
            return image
          }
          if (image.startsWith('data:')) {
            const isVideo = image.startsWith('data:video/')
            const mimeType = image.split(';')[0].split(':')[1]
            const extension = isVideo
              ? mimeType.includes('mp4')
                ? '.mp4'
                : mimeType.includes('mov')
                  ? '.mov'
                  : '.mp4'
              : mimeType.includes('webp')
                ? '.webp'
                : mimeType.includes('jpeg')
                  ? '.jpg'
                  : '.png'
            const filename = `image-${Date.now()}${extension}`
            const uploadResponse = await fetch('/api/properties/upload-image', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'same-origin',
              body: JSON.stringify({ file: image, filename, mimeType }),
            })
            if (!uploadResponse.ok) {
              const errText = await uploadResponse.text().catch(() => '')
              throw new Error(
                `Image/video upload failed (${uploadResponse.status}). ${errText.slice(0, 200)}`
              )
            }
            const uploadResult = await uploadResponse.json()
            return uploadResult.url
          }
          return image
        })
      )

      const uploadedFiles = await Promise.all(
        files.map(async (fileItem) => {
          if (fileItem.url && !fileItem.file) {
            return fileItem
          }
          if (fileItem.file) {
            const base64 = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader()
              reader.onload = () => resolve(reader.result as string)
              reader.onerror = reject
              reader.readAsDataURL(fileItem.file!)
            })
            const uploadResponse = await fetch('/api/properties/upload-file', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'same-origin',
              body: JSON.stringify({
                file: base64,
                filename: fileItem.filename || fileItem.file.name,
                mimeType: fileItem.mimeType || fileItem.file.type,
              }),
            })
            if (!uploadResponse.ok) {
              const errText = await uploadResponse.text().catch(() => '')
              throw new Error(
                `File upload failed (${uploadResponse.status}). ${errText.slice(0, 200)}`
              )
            }
            const uploadResult = await uploadResponse.json()
            return { ...fileItem, url: uploadResult.url, file: null }
          }
          return fileItem
        })
      )

      const stillDataUrl = uploadedImages.some(
        (i) => typeof i === 'string' && i.startsWith('data:')
      )
      if (stillDataUrl) {
        throw new Error(
          'Some gallery items are still raw uploads (not saved to disk). Fix failed uploads or remove those items.'
        )
      }

      await onSave({
        ...data,
        description: data.description || null,
        paymentPlan: data.paymentPlan || null,
        images: uploadedImages,
        files: uploadedFiles,
      })
    } catch (error) {
      console.error('Error saving property:', error)
      alert(getErrorMessage(error, 'Error saving property'))
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

  const areaLabel = (a: AreaOpt) => a.nameEn || a.name

  return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-gray-50 p-6 rounded-lg space-y-4">
          <h3 className="text-lg font-semibold text-graphite">Basic Information</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Listing market
            </label>
            <select
              {...register('listingMarket')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-champagne focus:border-champagne"
            >
              <option value="PRIMARY">Primary</option>
              <option value="SECONDARY">Secondary</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
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
              Description
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
                Status
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
                Price
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

        <div className="bg-gray-50 p-6 rounded-lg space-y-4">
          <h3 className="text-lg font-semibold text-graphite">Specifications</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unit type
            </label>
            <select
              {...register('type')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-champagne focus:border-champagne"
            >
              {PROPERTY_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Area (m²) *
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
                Bedrooms
              </label>
              <select
                {...register('bedrooms', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-champagne focus:border-champagne"
              >
                {BEDROOM_OPTIONS.map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bathrooms
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
                Year built
              </label>
              <input
                type="number"
                {...register('yearBuilt', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-champagne focus:border-champagne"
              />
            </div>
            {listingMarket === 'PRIMARY' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Handover / completion
                </label>
                <input
                  type="date"
                  {...register('completionDate')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-champagne focus:border-champagne"
                />
              </div>
            )}
          </div>

          {listingMarket === 'PRIMARY' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment plan
              </label>
              <textarea
                {...register('paymentPlan')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-champagne focus:border-champagne"
                placeholder="Payment schedule, post-handover plan…"
              />
            </div>
          )}

          {listingMarket === 'SECONDARY' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Occupancy (secondary)
              </label>
              <select
                {...register('occupancyStatus')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-champagne focus:border-champagne"
              >
                <option value="">—</option>
                <option value="VACANT">Vacant</option>
                <option value="TENANTED">Tenanted</option>
              </select>
            </div>
          )}
        </div>

        <div className="bg-gray-50 p-6 rounded-lg space-y-4">
          <h3 className="text-lg font-semibold text-graphite">Location</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
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
                City
              </label>
              <input
                type="text"
                {...register('city')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-champagne focus:border-champagne"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                District
              </label>
              <input
                type="text"
                {...register('district')}
                autoComplete="off"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-champagne focus:border-champagne"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Google Maps link
            </label>
            <input
              type="text"
              inputMode="url"
              autoComplete="off"
              {...register('googleMapsUrl')}
              placeholder="https://maps.app.goo.gl/… or Share → Copy link"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-champagne focus:border-champagne"
            />
            {errors.googleMapsUrl && (
              <p className="mt-1 text-sm text-red-600">{errors.googleMapsUrl.message as string}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Paste the link from Google Maps (Share). Embed links from “Embed a map” also work.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Area (catalog)
              </label>
              <p className="text-xs text-gray-500 mb-1">
                Manage areas in the sidebar: Areas.
              </p>
              {loadingData ? (
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 text-sm">
                  Loading areas…
                </div>
              ) : (
                <select
                  value={watch('areaId') ?? ''}
                  onChange={(e) => {
                    const v = e.target.value
                    setValue('areaId', v || null)
                    const a = areas.find((x) => x.id === v)
                    if (a) setValue('district', areaLabel(a))
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-champagne focus:border-champagne"
                >
                  <option value="">Not set</option>
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {areaLabel(a)}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {listingMarket === 'PRIMARY' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Developer (catalog)
                </label>
                <p className="text-xs text-gray-500 mb-1">
                  Manage developers in the sidebar: Developers.
                </p>
                {loadingData ? (
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 text-sm">
                    Loading developers…
                  </div>
                ) : (
                  <select
                    {...register('developerId')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-champagne focus:border-champagne"
                  >
                    <option value="">Not set</option>
                    {developers.map((developer) => (
                      <option key={developer.id} value={developer.id}>
                        {developer.nameEn || developer.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg">
          <ImageUpload
            images={images}
            onImagesChange={setImages}
            maxImages={30}
            label="Property Images & Videos"
          />
        </div>

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
              <button type="button" onClick={addFeature} className="btn-filled btn-sm">
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
              <button type="button" onClick={addAmenity} className="btn-filled btn-sm">
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

        <div className="bg-gray-50 p-6 rounded-lg space-y-4">
          <h3 className="text-lg font-semibold text-graphite">SEO</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Slug
            </label>
            <p className="text-xs text-gray-500 mb-1">
              Leave empty to auto-generate from the title.
            </p>
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

        <div className="bg-gray-50 p-6 rounded-lg space-y-4">
          <h3 className="text-lg font-semibold text-graphite">Settings</h3>
          <div className="flex items-center gap-4">
            <label className="flex items-center">
              <input type="checkbox" {...register('isPublished')} className="mr-2" />
              <span className="text-sm text-gray-700">Published</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" {...register('isFeatured')} className="mr-2" />
              <span className="text-sm text-gray-700">Featured</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4 border-t">
          <button type="button" onClick={onCancel} className="btn-ghost">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn-filled">
            {loading ? 'Saving...' : property ? 'Update Property' : 'Create Property'}
          </button>
        </div>
      </form>
  )
}
