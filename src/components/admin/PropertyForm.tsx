import { useState, useEffect, useRef, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  propertySchema,
  type PropertyFormData,
  type PropertyFormInput,
} from '@/lib/validations/property'
import { getErrorMessage } from '@/lib/utils/errorMessage'
import { generateSlug } from '@/lib/utils/slug'
import { generateLocalizedMetaIfMissing } from '@/lib/propertyMetaAutogen'
import type { ContentLocale } from '@/lib/geminiTranslate'
import ImageUpload from './ImageUpload'
import FileUpload, { type FileWithLabel } from './FileUpload'
import { XMarkIcon } from '@heroicons/react/24/outline'

const CONTENT_LOCALES: ContentLocale[] = ['en', 'ru', 'ar']

function otherLocales(source: ContentLocale): ContentLocale[] {
  return CONTENT_LOCALES.filter((l) => l !== source)
}

const TITLE_FIELD: Record<ContentLocale, 'title' | 'titleRu' | 'titleAr'> = {
  en: 'title',
  ru: 'titleRu',
  ar: 'titleAr',
}

const DESCRIPTION_FIELD: Record<ContentLocale, 'description' | 'descriptionRu' | 'descriptionAr'> = {
  en: 'description',
  ru: 'descriptionRu',
  ar: 'descriptionAr',
}

type LocaleTextKind = 'title' | 'description'

type LocaleTextSnapshot = { title: string; description: string }

function buildLocaleSnapshots(values: {
  title?: string | null
  titleRu?: string | null
  titleAr?: string | null
  description?: string | null
  descriptionRu?: string | null
  descriptionAr?: string | null
}): Record<ContentLocale, LocaleTextSnapshot> {
  return {
    en: {
      title: (values.title || '').trim(),
      description: (values.description || '').trim(),
    },
    ru: {
      title: (values.titleRu || '').trim(),
      description: (values.descriptionRu || '').trim(),
    },
    ar: {
      title: (values.titleAr || '').trim(),
      description: (values.descriptionAr || '').trim(),
    },
  }
}

function findEditedSourceLocale(
  current: Record<ContentLocale, LocaleTextSnapshot>,
  previous: Record<ContentLocale, LocaleTextSnapshot>
): ContentLocale | null {
  const changed: ContentLocale[] = []
  for (const locale of CONTENT_LOCALES) {
    const prev = previous[locale]
    const cur = current[locale]
    if (prev.title !== cur.title || prev.description !== cur.description) {
      changed.push(locale)
    }
  }
  if (changed.length === 1) {
    return changed[0]
  }
  return null
}

type TranslateApiResponse = {
  translations?: Partial<Record<ContentLocale, string[]>>
  message?: string
}

function alignTagLists(
  en: string[],
  ru: string[],
  ar: string[]
): Record<ContentLocale, string[]> {
  const maxLen = Math.max(en.length, ru.length, ar.length)
  const aligned: Record<ContentLocale, string[]> = { en: [], ru: [], ar: [] }
  for (let i = 0; i < maxLen; i++) {
    const enVal = (en[i] ?? '').trim()
    const ruVal = (ru[i] ?? '').trim()
    const arVal = (ar[i] ?? '').trim()
    const canonical = enVal || ruVal || arVal
    if (!canonical) continue
    aligned.en.push(enVal || canonical)
    aligned.ru.push(ruVal || canonical)
    aligned.ar.push(arVal || canonical)
  }
  return aligned
}

async function fetchTranslations(
  texts: string[],
  sourceLocale: ContentLocale,
  textKind: 'listing' | 'tag' = 'listing'
): Promise<Partial<Record<ContentLocale, string[]>>> {
  const res = await fetch('/api/admin/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({
      sourceLocale,
      targetLocales: otherLocales(sourceLocale),
      texts,
      textKind,
    }),
  })
  const data = (await res.json()) as TranslateApiResponse
  if (!res.ok) {
    throw new Error(data.message || 'Translation failed')
  }
  return data.translations ?? {}
}

interface PropertyFormProps {
  property?: EditableProperty
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
type DeveloperOpt = { id: string; name: string; nameEn?: string | null }
type EditablePropertyImage = string | { url?: string }
type EditablePropertyFile = {
  id?: string
  label?: string
  url?: string
  filename?: string
  size?: number
  mimeType?: string
}
type EditableProperty = {
  id?: string
  title?: string
  titleRu?: string | null
  titleAr?: string | null
  description?: string
  descriptionRu?: string | null
  descriptionAr?: string | null
  type?: string
  listingMarket?: 'PRIMARY' | 'SECONDARY'
  price?: number
  currency?: string
  status?: string
  areaSqm?: number
  area?: number
  bedrooms?: number
  bathrooms?: number
  parking?: number
  floor?: number
  totalFloors?: number
  yearBuilt?: number
  completionDate?: string | Date
  paymentPlan?: string
  occupancyStatus?: string
  address?: string
  city?: string
  district?: string
  areaId?: string
  developerId?: string
  googleMapsUrl?: string
  features?: string[]
  featuresRu?: string[]
  featuresAr?: string[]
  amenities?: string[]
  amenitiesRu?: string[]
  amenitiesAr?: string[]
  slug?: string
  metaTitle?: string
  metaTitleRu?: string | null
  metaTitleAr?: string | null
  metaDescription?: string
  metaDescriptionRu?: string | null
  metaDescriptionAr?: string | null
  images?: EditablePropertyImage[]
  files?: EditablePropertyFile[]
}

export default function PropertyForm({ property, onSave, onCancel }: PropertyFormProps) {
  const [images, setImages] = useState<string[]>([])
  const [files, setFiles] = useState<FileWithLabel[]>([])
  const [developers, setDevelopers] = useState<DeveloperOpt[]>([])
  const [areas, setAreas] = useState<AreaOpt[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [features, setFeatures] = useState<string[]>([])
  const [featuresRu, setFeaturesRu] = useState<string[]>([])
  const [featuresAr, setFeaturesAr] = useState<string[]>([])
  const [amenities, setAmenities] = useState<string[]>([])
  const [amenitiesRu, setAmenitiesRu] = useState<string[]>([])
  const [amenitiesAr, setAmenitiesAr] = useState<string[]>([])
  const [newFeature, setNewFeature] = useState('')
  const [newAmenity, setNewAmenity] = useState('')
  const [localeEditorTab, setLocaleEditorTab] = useState<ContentLocale>('en')
  const [translateStatus, setTranslateStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [translateError, setTranslateError] = useState('')
  const [tagTranslateBusy, setTagTranslateBusy] = useState(false)
  const localeSnapshotsRef = useRef<Record<ContentLocale, LocaleTextSnapshot>>(
    buildLocaleSnapshots({})
  )
  const isApplyingTranslation = useRef(false)
  const translateRequestSeq = useRef(0)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    getValues,
  } = useForm<PropertyFormInput, unknown, PropertyFormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: property
      ? {
          title: property.title || '',
          titleRu: property.titleRu ?? '',
          titleAr: property.titleAr ?? '',
          description: property.description || '',
          descriptionRu: property.descriptionRu ?? '',
          descriptionAr: property.descriptionAr ?? '',
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
          featuresRu: property.featuresRu || [],
          featuresAr: property.featuresAr || [],
          amenities: property.amenities || [],
          amenitiesRu: property.amenitiesRu || [],
          amenitiesAr: property.amenitiesAr || [],
          slug: property.slug || '',
          metaTitle: property.metaTitle || undefined,
          metaTitleRu: property.metaTitleRu ?? '',
          metaTitleAr: property.metaTitleAr ?? '',
          metaDescription: property.metaDescription || undefined,
          metaDescriptionRu: property.metaDescriptionRu ?? '',
          metaDescriptionAr: property.metaDescriptionAr ?? '',
        }
      : {
          currency: 'AED',
          status: 'AVAILABLE',
          type: 'APARTMENT',
          listingMarket: 'PRIMARY',
          bedrooms: 1,
          bathrooms: 1,
          features: [],
          featuresRu: [],
          featuresAr: [],
          amenities: [],
          amenitiesRu: [],
          amenitiesAr: [],
          googleMapsUrl: '',
          titleRu: '',
          titleAr: '',
          descriptionRu: '',
          descriptionAr: '',
          metaTitleRu: '',
          metaTitleAr: '',
          metaDescriptionRu: '',
          metaDescriptionAr: '',
        },
  })

  const title = watch('title')
  const titleRu = watch('titleRu')
  const titleAr = watch('titleAr')
  const listingMarket = watch('listingMarket')
  const descriptionEn = watch('description')
  const descriptionRu = watch('descriptionRu')
  const descriptionAr = watch('descriptionAr')
  const applyMetaPreview = useCallback(() => {
    const values = getValues()
    const generated = generateLocalizedMetaIfMissing(
      {
        title: values.title,
        titleRu: values.titleRu,
        titleAr: values.titleAr,
        description: values.description,
        descriptionRu: values.descriptionRu,
        descriptionAr: values.descriptionAr,
        type: values.type,
        city: values.city,
        district: values.district,
        features,
        featuresRu,
        featuresAr,
        amenities,
        amenitiesRu,
        amenitiesAr,
      },
      {
        metaTitle: values.metaTitle,
        metaTitleRu: values.metaTitleRu,
        metaTitleAr: values.metaTitleAr,
        metaDescription: values.metaDescription,
        metaDescriptionRu: values.metaDescriptionRu,
        metaDescriptionAr: values.metaDescriptionAr,
      }
    )
    if (!values.metaTitle?.trim() && generated.metaTitle) {
      setValue('metaTitle', generated.metaTitle)
    }
    if (!values.metaTitleRu?.trim() && generated.metaTitleRu) {
      setValue('metaTitleRu', generated.metaTitleRu)
    }
    if (!values.metaTitleAr?.trim() && generated.metaTitleAr) {
      setValue('metaTitleAr', generated.metaTitleAr)
    }
    if (!values.metaDescription?.trim() && generated.metaDescription) {
      setValue('metaDescription', generated.metaDescription)
    }
    if (!values.metaDescriptionRu?.trim() && generated.metaDescriptionRu) {
      setValue('metaDescriptionRu', generated.metaDescriptionRu)
    }
    if (!values.metaDescriptionAr?.trim() && generated.metaDescriptionAr) {
      setValue('metaDescriptionAr', generated.metaDescriptionAr)
    }
  }, [
    getValues,
    setValue,
    features,
    featuresRu,
    featuresAr,
    amenities,
    amenitiesRu,
    amenitiesAr,
  ])

  const applyFeatureLists = useCallback(
    (next: Record<ContentLocale, string[]>) => {
      setFeatures(next.en)
      setFeaturesRu(next.ru)
      setFeaturesAr(next.ar)
      setValue('features', next.en)
      setValue('featuresRu', next.ru)
      setValue('featuresAr', next.ar)
    },
    [setValue]
  )

  const applyAmenityLists = useCallback(
    (next: Record<ContentLocale, string[]>) => {
      setAmenities(next.en)
      setAmenitiesRu(next.ru)
      setAmenitiesAr(next.ar)
      setValue('amenities', next.en)
      setValue('amenitiesRu', next.ru)
      setValue('amenitiesAr', next.ar)
    },
    [setValue]
  )

  useEffect(() => {
    if (isApplyingTranslation.current) {
      return
    }

    const current = buildLocaleSnapshots({
      title,
      titleRu,
      titleAr,
      description: descriptionEn,
      descriptionRu,
      descriptionAr,
    })
    const source = findEditedSourceLocale(current, localeSnapshotsRef.current)
    if (!source) {
      return
    }

    const { title: titleTrimmed, description: descriptionTrimmed } = current[source]
    if (!titleTrimmed && !descriptionTrimmed) {
      localeSnapshotsRef.current = current
      setTranslateStatus('idle')
      setTranslateError('')
      return
    }

    const texts: string[] = []
    const kinds: LocaleTextKind[] = []
    if (titleTrimmed) {
      texts.push(titleTrimmed)
      kinds.push('title')
    }
    if (descriptionTrimmed) {
      texts.push(descriptionTrimmed)
      kinds.push('description')
    }

    localeSnapshotsRef.current = {
      ...localeSnapshotsRef.current,
      [source]: current[source],
    }

    const timer = setTimeout(() => {
      const requestId = ++translateRequestSeq.current
      void (async () => {
        setTranslateStatus('loading')
        setTranslateError('')
        try {
          const translations = await fetchTranslations(texts, source)
          if (requestId !== translateRequestSeq.current) {
            return
          }
          isApplyingTranslation.current = true
          for (const locale of otherLocales(source)) {
            const translated = translations[locale] ?? []
            kinds.forEach((kind, index) => {
              const value = translated[index] ?? ''
              if (kind === 'title') {
                setValue(TITLE_FIELD[locale], value)
              } else {
                setValue(DESCRIPTION_FIELD[locale], value)
              }
            })
          }
          localeSnapshotsRef.current = buildLocaleSnapshots(getValues())
          setTranslateStatus('idle')
          setTranslateError('')
          applyMetaPreview()
        } catch (err: unknown) {
          if (requestId !== translateRequestSeq.current) {
            return
          }
          setTranslateStatus('error')
          setTranslateError(getErrorMessage(err, 'Translation failed'))
        } finally {
          if (requestId === translateRequestSeq.current) {
            isApplyingTranslation.current = false
          }
        }
      })()
    }, 1000)

    return () => clearTimeout(timer)
  }, [
    title,
    titleRu,
    titleAr,
    descriptionEn,
    descriptionRu,
    descriptionAr,
    getValues,
    setValue,
    applyMetaPreview,
  ])

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
    } catch (e: unknown) {
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
          property.images.map((img: EditablePropertyImage) =>
            typeof img === 'string' ? img : img.url || ''
          )
        )
      } else {
        setImages([])
      }
      const alignedFeatures = alignTagLists(
        property.features || [],
        property.featuresRu || [],
        property.featuresAr || []
      )
      const alignedAmenities = alignTagLists(
        property.amenities || [],
        property.amenitiesRu || [],
        property.amenitiesAr || []
      )
      applyFeatureLists(alignedFeatures)
      applyAmenityLists(alignedAmenities)
      if (property.files && Array.isArray(property.files) && property.files.length > 0) {
        setFiles(
          property.files.map((file: EditablePropertyFile) => ({
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
      localeSnapshotsRef.current = buildLocaleSnapshots({
        title: property.title,
        titleRu: property.titleRu,
        titleAr: property.titleAr,
        description: property.description,
        descriptionRu: property.descriptionRu,
        descriptionAr: property.descriptionAr,
      })
    } else {
      setImages([])
      setFiles([])
      applyFeatureLists({ en: [], ru: [], ar: [] })
      applyAmenityLists({ en: [], ru: [], ar: [] })
      localeSnapshotsRef.current = buildLocaleSnapshots({})
    }
  }, [property, setValue, applyFeatureLists, applyAmenityLists])

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
        features,
        featuresRu,
        featuresAr,
        amenities,
        amenitiesRu,
        amenitiesAr,
        isPublished: true,
        isFeatured: false,
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

  const featureLists: Record<ContentLocale, string[]> = {
    en: features,
    ru: featuresRu,
    ar: featuresAr,
  }
  const amenityLists: Record<ContentLocale, string[]> = {
    en: amenities,
    ru: amenitiesRu,
    ar: amenitiesAr,
  }

  const appendTagWithTranslation = async (
    kind: 'feature' | 'amenity',
    source: ContentLocale,
    trimmed: string
  ) => {
    const current =
      kind === 'feature'
        ? { en: features, ru: featuresRu, ar: featuresAr }
        : { en: amenities, ru: amenitiesRu, ar: amenitiesAr }
    const snapshot: Record<ContentLocale, string[]> = {
      en: [...current.en],
      ru: [...current.ru],
      ar: [...current.ar],
    }

    setTagTranslateBusy(true)
    setTranslateStatus('loading')
    setTranslateError('')
    try {
      const translations = await fetchTranslations([trimmed], source, 'tag')
      const next: Record<ContentLocale, string[]> = {
        en: [...snapshot.en],
        ru: [...snapshot.ru],
        ar: [...snapshot.ar],
      }
      next[source] = [...next[source], trimmed]
      for (const locale of otherLocales(source)) {
        const translated = (translations[locale]?.[0] ?? '').trim()
        if (!translated) {
          throw new Error('Empty translation for tag')
        }
        next[locale] = [...next[locale], translated]
      }
      if (kind === 'feature') {
        applyFeatureLists(next)
      } else {
        applyAmenityLists(next)
      }
      setTranslateStatus('idle')
      applyMetaPreview()
    } catch (err: unknown) {
      setTranslateStatus('error')
      setTranslateError(getErrorMessage(err, 'Tag translation failed'))
    } finally {
      setTagTranslateBusy(false)
    }
  }

  const addFeature = () => {
    const trimmed = newFeature.trim()
    if (!trimmed || tagTranslateBusy) return
    setNewFeature('')
    void appendTagWithTranslation('feature', localeEditorTab, trimmed)
  }

  const removeFeature = (index: number) => {
    applyFeatureLists({
      en: features.filter((_, i) => i !== index),
      ru: featuresRu.filter((_, i) => i !== index),
      ar: featuresAr.filter((_, i) => i !== index),
    })
    applyMetaPreview()
  }

  const addAmenity = () => {
    const trimmed = newAmenity.trim()
    if (!trimmed || tagTranslateBusy) return
    setNewAmenity('')
    void appendTagWithTranslation('amenity', localeEditorTab, trimmed)
  }

  const removeAmenity = (index: number) => {
    applyAmenityLists({
      en: amenities.filter((_, i) => i !== index),
      ru: amenitiesRu.filter((_, i) => i !== index),
      ar: amenitiesAr.filter((_, i) => i !== index),
    })
    applyMetaPreview()
  }

  const renderFeaturesAmenities = (rtl?: boolean) => {
    const activeFeatures = featureLists[localeEditorTab]
    const activeAmenities = amenityLists[localeEditorTab]
    const featureLabel =
      localeEditorTab === 'en'
        ? 'Features (English)'
        : localeEditorTab === 'ru'
          ? 'Features (Russian)'
          : 'Features (Arabic)'
    const amenityLabel =
      localeEditorTab === 'en'
        ? 'Amenities (English)'
        : localeEditorTab === 'ru'
          ? 'Amenities (Russian)'
          : 'Amenities (Arabic)'

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{featureLabel}</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              dir={rtl ? 'rtl' : undefined}
              value={newFeature}
              onChange={(e) => setNewFeature(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
              placeholder="Add feature"
              className={`flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-hidden focus:ring-champagne focus:border-champagne${rtl ? ' text-right' : ''}`}
            />
            <button
              type="button"
              onClick={addFeature}
              disabled={tagTranslateBusy}
              className="btn-filled btn-sm"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {activeFeatures.map((feature, index) => (
              <span
                key={`f-${localeEditorTab}-${index}`}
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
          <label className="block text-sm font-medium text-gray-700 mb-2">{amenityLabel}</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              dir={rtl ? 'rtl' : undefined}
              value={newAmenity}
              onChange={(e) => setNewAmenity(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAmenity())}
              placeholder="Add amenity"
              className={`flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-hidden focus:ring-champagne focus:border-champagne${rtl ? ' text-right' : ''}`}
            />
            <button
              type="button"
              onClick={addAmenity}
              disabled={tagTranslateBusy}
              className="btn-filled btn-sm"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {activeAmenities.map((amenity, index) => (
              <span
                key={`a-${localeEditorTab}-${index}`}
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
    )
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-hidden focus:ring-champagne focus:border-champagne"
            >
              <option value="PRIMARY">Primary</option>
              <option value="SECONDARY">Secondary</option>
            </select>
          </div>

          <div className="rounded-lg border border-champagne/30 bg-white p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <h4 className="text-sm font-semibold text-graphite">Listing text & SEO (by language)</h4>
              <div className="flex rounded-md border border-gray-200 bg-gray-50 p-0.5 gap-0.5 flex-wrap">
                {(
                  [
                    { id: 'en' as const, label: 'English' },
                    { id: 'ru' as const, label: 'Русский' },
                    { id: 'ar' as const, label: 'العربية' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setLocaleEditorTab(tab.id)}
                    className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                      localeEditorTab === tab.id
                        ? 'bg-champagne text-white shadow-sm'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-xs text-gray-500">
              English is the site default. Russian and Arabic are shown when the visitor chooses that
              language; empty fields fall back to English.
            </p>
            <p className="text-xs text-gray-500">
              If meta fields are left empty, they are generated automatically on save from title,
              description, district, type, and key features.
            </p>
            <p className="text-xs text-gray-500">
              Title and description auto-translate when you edit text in one language; switching tabs
              does not re-translate. Features and amenities are added in the active tab and translated
              to all three languages at once.
            </p>
            {translateStatus === 'loading' && (
              <p className="text-xs text-champagne">Translating…</p>
            )}
            {translateStatus === 'error' && translateError && (
              <p className="text-xs text-red-600">{translateError}</p>
            )}

            <div className={localeEditorTab === 'en' ? 'space-y-4' : 'hidden'}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title (English)</label>
                <input
                  type="text"
                  {...register('title')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-hidden focus:ring-champagne focus:border-champagne"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (English)</label>
                <textarea
                  {...register('description')}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-hidden focus:ring-champagne focus:border-champagne"
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>
            </div>

            <div className={localeEditorTab === 'ru' ? 'space-y-4' : 'hidden'}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title (Russian)</label>
                <input
                  type="text"
                  {...register('titleRu')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-hidden focus:ring-champagne focus:border-champagne"
                />
                {errors.titleRu && (
                  <p className="mt-1 text-sm text-red-600">{errors.titleRu.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Russian)</label>
                <textarea
                  {...register('descriptionRu')}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-hidden focus:ring-champagne focus:border-champagne"
                />
                {errors.descriptionRu && (
                  <p className="mt-1 text-sm text-red-600">{errors.descriptionRu.message}</p>
                )}
              </div>
            </div>

            <div dir="rtl" className={localeEditorTab === 'ar' ? 'space-y-4' : 'hidden'}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title (Arabic)</label>
                <input
                  type="text"
                  {...register('titleAr')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-hidden focus:ring-champagne focus:border-champagne text-right"
                />
                {errors.titleAr && (
                  <p className="mt-1 text-sm text-red-600">{errors.titleAr.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Arabic)</label>
                <textarea
                  {...register('descriptionAr')}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-hidden focus:ring-champagne focus:border-champagne text-right"
                />
                {errors.descriptionAr && (
                  <p className="mt-1 text-sm text-red-600">{errors.descriptionAr.message}</p>
                )}
              </div>
            </div>

            {renderFeaturesAmenities(localeEditorTab === 'ar')}

            <div className={localeEditorTab === 'en' ? 'space-y-4' : 'hidden'}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meta title (English)</label>
                <input
                  type="text"
                  {...register('metaTitle')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-hidden focus:ring-champagne focus:border-champagne"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meta description (English)</label>
                <textarea
                  {...register('metaDescription')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-hidden focus:ring-champagne focus:border-champagne"
                />
              </div>
            </div>

            <div className={localeEditorTab === 'ru' ? 'space-y-4' : 'hidden'}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meta title (Russian)</label>
                <input type="text" {...register('metaTitleRu')} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-hidden focus:ring-champagne focus:border-champagne" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meta description (Russian)</label>
                <textarea {...register('metaDescriptionRu')} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-hidden focus:ring-champagne focus:border-champagne" />
              </div>
            </div>

            <div dir="rtl" className={localeEditorTab === 'ar' ? 'space-y-4' : 'hidden'}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meta title (Arabic)</label>
                <input type="text" {...register('metaTitleAr')} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-hidden focus:ring-champagne focus:border-champagne text-right" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meta description (Arabic)</label>
                <textarea {...register('metaDescriptionAr')} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-hidden focus:ring-champagne focus:border-champagne text-right" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                {...register('status')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-hidden focus:ring-champagne focus:border-champagne"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-hidden focus:ring-champagne focus:border-champagne"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-hidden focus:ring-champagne focus:border-champagne"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-hidden focus:ring-champagne focus:border-champagne"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-hidden focus:ring-champagne focus:border-champagne"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bedrooms
              </label>
              <select
                {...register('bedrooms', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-hidden focus:ring-champagne focus:border-champagne"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-hidden focus:ring-champagne focus:border-champagne"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Parking
              </label>
              <input
                type="number"
                {...register('parking', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-hidden focus:ring-champagne focus:border-champagne"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-hidden focus:ring-champagne focus:border-champagne"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Floors
              </label>
              <input
                type="number"
                {...register('totalFloors', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-hidden focus:ring-champagne focus:border-champagne"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year built
              </label>
              <input
                type="number"
                {...register('yearBuilt', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-hidden focus:ring-champagne focus:border-champagne"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-hidden focus:ring-champagne focus:border-champagne"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-hidden focus:ring-champagne focus:border-champagne"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-hidden focus:ring-champagne focus:border-champagne"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-hidden focus:ring-champagne focus:border-champagne"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-hidden focus:ring-champagne focus:border-champagne"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-hidden focus:ring-champagne focus:border-champagne"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-hidden focus:ring-champagne focus:border-champagne"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-hidden focus:ring-champagne focus:border-champagne"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-hidden focus:ring-champagne focus:border-champagne"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-hidden focus:ring-champagne focus:border-champagne"
            />
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
