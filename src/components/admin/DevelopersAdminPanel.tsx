import { useCallback, useEffect, useRef, useState, Fragment } from 'react'
import Image from 'next/image'
import { Dialog, Transition } from '@headlessui/react'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ArrowsUpDownIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import LogoImageEditor from './LogoImageEditor'
import { normalizeImageUrl } from '@/lib/utils/imageUrl'
import { getErrorMessage } from '@/lib/utils/errorMessage'
import type { ContentLocale } from '@/lib/geminiTranslate'

const CONTENT_LOCALES: ContentLocale[] = ['en', 'ru', 'ar']

function otherLocales(source: ContentLocale): ContentLocale[] {
  return CONTENT_LOCALES.filter((l) => l !== source)
}

type LocaleSnapshot = { description: string }

function buildLocaleSnapshots(values: {
  description?: string
  descriptionRu?: string
  descriptionAr?: string
}): Record<ContentLocale, LocaleSnapshot> {
  return {
    en: { description: (values.description || '').trim() },
    ru: { description: (values.descriptionRu || '').trim() },
    ar: { description: (values.descriptionAr || '').trim() },
  }
}

function findEditedSourceLocale(
  current: Record<ContentLocale, LocaleSnapshot>,
  previous: Record<ContentLocale, LocaleSnapshot>
): ContentLocale | null {
  const changed: ContentLocale[] = []
  for (const locale of CONTENT_LOCALES) {
    if (previous[locale].description !== current[locale].description) {
      changed.push(locale)
    }
  }
  if (changed.length === 1) return changed[0]
  return null
}

function snapshotsAfterTranslation(
  source: ContentLocale,
  sourceText: string,
  translations: Partial<Record<ContentLocale, string[]>>,
  previous: Record<ContentLocale, LocaleSnapshot>
): Record<ContentLocale, LocaleSnapshot> {
  const next = { ...previous }
  next[source] = { description: sourceText }
  for (const locale of otherLocales(source)) {
    next[locale] = { description: (translations[locale]?.[0] ?? '').trim() }
  }
  return next
}

type TranslateApiResponse = {
  translations?: Partial<Record<ContentLocale, string[]>>
  message?: string
}

async function fetchTranslations(
  texts: string[],
  sourceLocale: ContentLocale,
  textKind: 'listing' | 'developer' = 'listing'
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

type DeveloperRow = {
  id: string
  name: string
  nameEn: string | null
  nameRu?: string | null
  nameAr?: string | null
  slug: string
  logo: string | null
  description: string | null
  descriptionEn?: string | null
  descriptionRu?: string | null
  descriptionAr?: string | null
  website: string | null
  specialties: string[]
  specialtiesRu?: string[]
  specialtiesAr?: string[]
  notableProjects: string[]
  notableProjectsRu?: string[]
  notableProjectsAr?: string[]
  founded: number | null
  isActive: boolean
  propertiesCount: number
}

const emptyForm = {
  name: '',
  description: '',
  descriptionRu: '',
  descriptionAr: '',
  website: '',
  specialties: [] as string[],
  specialtiesRu: [] as string[],
  specialtiesAr: [] as string[],
  notableProjects: [] as string[],
  notableProjectsRu: [] as string[],
  notableProjectsAr: [] as string[],
  founded: '',
  logo: '' as string,
  isActive: true,
}

function StringTagEditor({
  label,
  placeholder,
  items,
  newValue,
  onNewValueChange,
  onItemsChange,
  onAdd,
}: {
  label: string
  placeholder: string
  items: string[]
  newValue: string
  onNewValueChange: (value: string) => void
  onItemsChange: (items: string[]) => void
  onAdd?: () => void
}) {
  const addItem = () => {
    if (onAdd) {
      onAdd()
      return
    }
    const trimmed = newValue.trim()
    if (!trimmed) return
    onNewValueChange('')
    if (items.some((item) => item.toLowerCase() === trimmed.toLowerCase())) return
    onItemsChange([...items, trimmed])
  }

  const removeItem = (index: number) => {
    onItemsChange(items.filter((_, i) => i !== index))
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          value={newValue}
          onChange={(e) => onNewValueChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addItem()
            }
          }}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-hidden focus:ring-champagne focus:border-champagne"
        />
        <button type="button" onClick={addItem} className="btn-filled btn-sm">
          Add
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((item, index) => (
          <span
            key={`${label}-${index}-${item}`}
            className="inline-flex items-center gap-1 px-3 py-1 bg-champagne/20 text-champagne rounded-full text-sm"
          >
            {item}
            <button
              type="button"
              onClick={() => removeItem(index)}
              className="text-champagne hover:text-red-600"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </span>
        ))}
      </div>
    </div>
  )
}

export default function DevelopersAdminPanel() {
  const [rows, setRows] = useState<DeveloperRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<'name' | 'properties'>('name')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<DeveloperRow | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [newSpecialty, setNewSpecialty] = useState('')
  const [newNotableProject, setNewNotableProject] = useState('')
  const [saving, setSaving] = useState(false)
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoEditorOpen, setLogoEditorOpen] = useState(false)
  const [logoEditorImage, setLogoEditorImage] = useState('')
  const [logoEditorFilename, setLogoEditorFilename] = useState('logo.webp')
  const [selectedLogoName, setSelectedLogoName] = useState('')
  const [logoRawSource, setLogoRawSource] = useState('')
  const logoInputRef = useRef<HTMLInputElement | null>(null)
  const [localeEditorTab, setLocaleEditorTab] = useState<ContentLocale>('en')
  const [translateStatus, setTranslateStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [translateError, setTranslateError] = useState('')
  const [tagTranslateBusy, setTagTranslateBusy] = useState(false)
  const localeSnapshotsRef = useRef<Record<ContentLocale, LocaleSnapshot>>(
    buildLocaleSnapshots({})
  )
  const isApplyingTranslation = useRef(false)
  const translateRequestSeq = useRef(0)
  const lastEditedDescriptionLocaleRef = useRef<ContentLocale>('en')

  const specialtyLists: Record<ContentLocale, string[]> = {
    en: form.specialties,
    ru: form.specialtiesRu,
    ar: form.specialtiesAr,
  }
  const projectLists: Record<ContentLocale, string[]> = {
    en: form.notableProjects,
    ru: form.notableProjectsRu,
    ar: form.notableProjectsAr,
  }

  const applySpecialtyLists = (next: Record<ContentLocale, string[]>) => {
    setForm((f) => ({
      ...f,
      specialties: next.en,
      specialtiesRu: next.ru,
      specialtiesAr: next.ar,
    }))
  }

  const applyProjectLists = (next: Record<ContentLocale, string[]>) => {
    setForm((f) => ({
      ...f,
      notableProjects: next.en,
      notableProjectsRu: next.ru,
      notableProjectsAr: next.ar,
    }))
  }

  const setDescriptionForLocale = (locale: ContentLocale, value: string) => {
    if (locale === 'en') setForm((f) => ({ ...f, description: value }))
    else if (locale === 'ru') setForm((f) => ({ ...f, descriptionRu: value }))
    else setForm((f) => ({ ...f, descriptionAr: value }))
  }

  useEffect(() => {
    if (!modalOpen || isApplyingTranslation.current) return

    const current = buildLocaleSnapshots(form)
    const previous = localeSnapshotsRef.current
    const detected = findEditedSourceLocale(current, previous)
    const source =
      detected ??
      (current[lastEditedDescriptionLocaleRef.current].description !==
      previous[lastEditedDescriptionLocaleRef.current].description
        ? lastEditedDescriptionLocaleRef.current
        : null)
    if (!source) return

    const descriptionTrimmed = current[source].description
    if (!descriptionTrimmed) {
      localeSnapshotsRef.current = current
      setTranslateStatus('idle')
      setTranslateError('')
      return
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
          const translations = await fetchTranslations([descriptionTrimmed], source, 'listing')
          if (requestId !== translateRequestSeq.current) return
          isApplyingTranslation.current = true
          for (const locale of otherLocales(source)) {
            const translated = (translations[locale]?.[0] ?? '').trim()
            setDescriptionForLocale(locale, translated)
          }
          localeSnapshotsRef.current = snapshotsAfterTranslation(
            source,
            descriptionTrimmed,
            translations,
            localeSnapshotsRef.current
          )
          setTranslateStatus('idle')
        } catch (err: unknown) {
          if (requestId !== translateRequestSeq.current) return
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
  }, [modalOpen, form.description, form.descriptionRu, form.descriptionAr])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const q = new URLSearchParams({ admin: '1', sort })
      if (search.trim()) q.set('search', search.trim())
      const res = await fetch(`/api/developers?${q}`)
      const data = await res.json()
      setRows(data.developers || [])
    } catch (e) {
      console.error(e)
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [search, sort])

  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [load])

  const appendTagWithTranslation = async (
    kind: 'specialty' | 'project',
    source: ContentLocale,
    trimmed: string
  ) => {
    const current =
      kind === 'specialty'
        ? { en: form.specialties, ru: form.specialtiesRu, ar: form.specialtiesAr }
        : { en: form.notableProjects, ru: form.notableProjectsRu, ar: form.notableProjectsAr }
    const snapshot: Record<ContentLocale, string[]> = {
      en: [...current.en],
      ru: [...current.ru],
      ar: [...current.ar],
    }

    setTagTranslateBusy(true)
    setTranslateStatus('loading')
    setTranslateError('')
    try {
      const translations = await fetchTranslations([trimmed], source, 'developer')
      const next: Record<ContentLocale, string[]> = {
        en: [...snapshot.en],
        ru: [...snapshot.ru],
        ar: [...snapshot.ar],
      }
      next[source] = [...next[source], trimmed]
      for (const locale of otherLocales(source)) {
        const translated = (translations[locale]?.[0] ?? '').trim()
        if (!translated) throw new Error('Empty translation for tag')
        next[locale] = [...next[locale], translated]
      }
      if (kind === 'specialty') {
        applySpecialtyLists(next)
      } else {
        applyProjectLists(next)
      }
      setTranslateStatus('idle')
    } catch (err: unknown) {
      setTranslateStatus('error')
      setTranslateError(getErrorMessage(err, 'Tag translation failed'))
    } finally {
      setTagTranslateBusy(false)
    }
  }

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setLocaleEditorTab('en')
    lastEditedDescriptionLocaleRef.current = 'en'
    setTranslateStatus('idle')
    setTranslateError('')
    localeSnapshotsRef.current = buildLocaleSnapshots({})
    setNewSpecialty('')
    setNewNotableProject('')
    setSelectedLogoName('')
    setLogoRawSource('')
    setModalOpen(true)
  }

  const openEdit = (d: DeveloperRow) => {
    setEditing(d)
    const descriptionEn = (d.description || d.descriptionEn || '').trim()
    const nextForm = {
      name: (d.nameEn || d.name || '').trim(),
      description: descriptionEn,
      descriptionRu: (d.descriptionRu || '').trim(),
      descriptionAr: (d.descriptionAr || '').trim(),
      website: d.website || '',
      specialties: Array.isArray(d.specialties) ? [...d.specialties] : [],
      specialtiesRu: Array.isArray(d.specialtiesRu) ? [...d.specialtiesRu] : [],
      specialtiesAr: Array.isArray(d.specialtiesAr) ? [...d.specialtiesAr] : [],
      notableProjects: Array.isArray(d.notableProjects) ? [...d.notableProjects] : [],
      notableProjectsRu: Array.isArray(d.notableProjectsRu) ? [...d.notableProjectsRu] : [],
      notableProjectsAr: Array.isArray(d.notableProjectsAr) ? [...d.notableProjectsAr] : [],
      founded: d.founded != null ? String(d.founded) : '',
      logo: d.logo || '',
      isActive: d.isActive,
    }
    setForm(nextForm)
    setLocaleEditorTab('en')
    lastEditedDescriptionLocaleRef.current = 'en'
    setTranslateStatus('idle')
    setTranslateError('')
    localeSnapshotsRef.current = buildLocaleSnapshots(nextForm)
    setNewSpecialty('')
    setNewNotableProject('')
    setSelectedLogoName('')
    setLogoRawSource(d.logo || '')
    setModalOpen(true)
  }

  const uploadLogo = async (uploadData: string, uploadFilename: string) => {
    setLogoUploading(true)
    try {
      const res = await fetch('/api/developers/upload-logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ file: uploadData, filename: uploadFilename }),
      })
      const rawBody = await res.text()
      let json: { url?: string; success?: boolean; message?: string } = {}
      try {
        json = rawBody ? JSON.parse(rawBody) : {}
      } catch {
        json = {}
      }
      if (res.ok && json.url) {
        setForm((f) => ({ ...f, logo: json.url as string }))
        return
      }
      throw new Error(json?.message || 'Logo upload failed')
    } finally {
      setLogoUploading(false)
    }
  }

  const handleLogoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedLogoName(file.name)
    const reader = new FileReader()
    reader.onload = () => {
      const rawImage = reader.result as string
      setLogoRawSource(rawImage)
      setLogoEditorImage(rawImage)
      setLogoEditorFilename(file.name)
      setLogoEditorOpen(true)
    }
    reader.readAsDataURL(file)
  }

  const openEditorForCurrentLogo = () => {
    if (!form.logo) return
    const normalizedLogo = normalizeImageUrl(form.logo) || form.logo
    setLogoEditorImage(logoRawSource || normalizedLogo)
    setLogoEditorFilename(selectedLogoName || 'logo.webp')
    setLogoEditorOpen(true)
  }

  const save = async () => {
    if (logoUploading) {
      alert('Please wait until logo upload is complete')
      return
    }
    if (!form.name.trim()) {
      alert('Name is required')
      return
    }
    const foundedRaw = form.founded.trim()
    let founded: number | null = null
    if (foundedRaw) {
      const year = Number.parseInt(foundedRaw, 10)
      if (!Number.isFinite(year) || year < 1000 || year > 9999) {
        alert('Date founded must be a valid year (1000–9999)')
        return
      }
      founded = year
    }
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        descriptionRu: form.descriptionRu.trim() || null,
        descriptionAr: form.descriptionAr.trim() || null,
        website: form.website.trim() || null,
        specialties: form.specialties.map((v) => v.trim()).filter(Boolean),
        specialtiesRu: form.specialtiesRu.map((v) => v.trim()).filter(Boolean),
        specialtiesAr: form.specialtiesAr.map((v) => v.trim()).filter(Boolean),
        notableProjects: form.notableProjects.map((v) => v.trim()).filter(Boolean),
        notableProjectsRu: form.notableProjectsRu.map((v) => v.trim()).filter(Boolean),
        notableProjectsAr: form.notableProjectsAr.map((v) => v.trim()).filter(Boolean),
        founded,
        logo: form.logo || null,
        isActive: form.isActive,
      }
      const url = editing
        ? `/api/developers/item/${editing.id}`
        : '/api/developers'
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(payload),
      })
      const responseBody = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(responseBody.message || 'Save failed')
      }
      if (responseBody.localeContentSaved === false) {
        alert(
          'Saved partially: Russian/Arabic columns are missing in the database. Apply Prisma migrations or run scripts/create-tables.sql on the server.'
        )
      }
      setModalOpen(false)
      await load()
    } catch (e: unknown) {
      alert((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const remove = async (d: DeveloperRow) => {
    const res = await fetch(`/api/developers/item/${d.id}`, { method: 'DELETE' })
    if (res.ok) {
      load()
      return
    }
    if (res.status === 409) {
      const data = await res.json()
      const n = data.linkedProperties ?? 0
      if (
        !confirm(
          `${n} listing(s) reference this developer. Unlink them and delete?`
        )
      ) {
        return
      }
      const res2 = await fetch(`/api/developers/item/${d.id}?force=1`, {
        method: 'DELETE',
      })
      if (!res2.ok) {
        alert('Delete failed')
        return
      }
    } else {
      alert('Delete failed')
      return
    }
    load()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search developers..."
              className="pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm w-64"
            />
          </div>
          <button
            type="button"
            onClick={() => setSort(sort === 'name' ? 'properties' : 'name')}
            className="inline-flex items-center gap-1 btn-outline btn-sm"
          >
            <ArrowsUpDownIcon className="h-4 w-4" />
            {sort === 'name' ? 'Sort: A–Z' : 'Sort: listings'}
          </button>
        </div>
        <button type="button" onClick={openCreate} className="btn-filled btn-sm inline-flex items-center gap-1">
          <PlusIcon className="h-4 w-4" />
          Add developer
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
        {loading ? (
          <p className="p-6 text-gray-500">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="p-6 text-gray-500">No developers</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Active
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Listings
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rows.map((d) => {
                const displayName = d.nameEn || d.name
                return (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-graphite">
                      {displayName}
                    </td>
                    <td className="px-4 py-3 text-sm">{d.isActive ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-3 text-sm">{d.propertiesCount}</td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => openEdit(d)}
                        className="inline-flex text-champagne hover:text-champagne/80"
                        title="Edit"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(d)}
                        className="inline-flex text-red-600 hover:text-red-800"
                        title="Delete"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <Transition appear show={modalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setModalOpen(false)}>
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
              <Dialog.Panel className="w-full max-w-xl rounded-xl bg-white p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
                <Dialog.Title className="text-lg font-semibold text-graphite">
                  {editing ? 'Edit developer' : 'New developer'}
                </Dialog.Title>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div className="rounded-lg border border-champagne/30 bg-white p-4 space-y-3">
                  <div className="flex justify-end">
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
                  {translateStatus === 'loading' && (
                    <p className="text-xs text-champagne">Translating…</p>
                  )}
                  {translateStatus === 'error' && translateError && (
                    <p className="text-xs text-red-600">{translateError}</p>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description (
                      {localeEditorTab === 'en'
                        ? 'English'
                        : localeEditorTab === 'ru'
                          ? 'Russian'
                          : 'Arabic'}
                      )
                    </label>
                    <textarea
                      rows={3}
                      dir={localeEditorTab === 'ar' ? 'rtl' : 'ltr'}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      value={
                        localeEditorTab === 'en'
                          ? form.description
                          : localeEditorTab === 'ru'
                            ? form.descriptionRu
                            : form.descriptionAr
                      }
                      onChange={(e) => {
                        lastEditedDescriptionLocaleRef.current = localeEditorTab
                        setDescriptionForLocale(localeEditorTab, e.target.value)
                      }}
                    />
                  </div>
                  <StringTagEditor
                    label="Specialties"
                    placeholder="Add specialty"
                    items={specialtyLists[localeEditorTab]}
                    newValue={newSpecialty}
                    onNewValueChange={setNewSpecialty}
                    onItemsChange={(items) => {
                      const next = { ...specialtyLists, [localeEditorTab]: items }
                      applySpecialtyLists(next)
                    }}
                    onAdd={() => {
                      const trimmed = newSpecialty.trim()
                      if (!trimmed || tagTranslateBusy) return
                      setNewSpecialty('')
                      void appendTagWithTranslation('specialty', localeEditorTab, trimmed)
                    }}
                  />
                  <StringTagEditor
                    label="Notable projects"
                    placeholder="Add project"
                    items={projectLists[localeEditorTab]}
                    newValue={newNotableProject}
                    onNewValueChange={setNewNotableProject}
                    onItemsChange={(items) => {
                      const next = { ...projectLists, [localeEditorTab]: items }
                      applyProjectLists(next)
                    }}
                    onAdd={() => {
                      const trimmed = newNotableProject.trim()
                      if (!trimmed || tagTranslateBusy) return
                      setNewNotableProject('')
                      void appendTagWithTranslation('project', localeEditorTab, trimmed)
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Website
                  </label>
                  <input
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    value={form.website}
                    onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                    placeholder="https://"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date founded
                  </label>
                  <input
                    type="number"
                    min={1000}
                    max={9999}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    value={form.founded}
                    onChange={(e) => setForm((f) => ({ ...f, founded: e.target.value }))}
                    placeholder="e.g. 1997"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Logo
                  </label>
                  <div className="rounded-xl border border-gray-200 p-4 bg-white space-y-3">
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoFile}
                      className="hidden"
                    />
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="btn-filled btn-sm"
                          onClick={() =>
                            form.logo ? openEditorForCurrentLogo() : logoInputRef.current?.click()
                          }
                        >
                          {form.logo ? 'Edit Photo' : 'Upload Logo'}
                        </button>
                        {form.logo && (
                          <button
                            type="button"
                            className="btn-ghost btn-sm"
                            onClick={() => {
                              setForm((f) => ({ ...f, logo: '' }))
                              setSelectedLogoName('')
                              setLogoRawSource('')
                              if (logoInputRef.current) logoInputRef.current.value = ''
                            }}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 truncate max-w-[65%] text-right">
                        {selectedLogoName || 'PNG, JPG, WEBP'}
                      </span>
                    </div>

                    {form.logo ? (
                      <div className="grid grid-cols-1 gap-3 items-center">
                        <div className="h-24 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
                          <Image
                            src={form.logo}
                            alt=""
                            width={170}
                            height={96}
                            className="h-full w-full object-contain"
                            unoptimized
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="h-24 rounded-lg border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center text-sm text-gray-400">
                        No logo uploaded
                      </div>
                    )}
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, isActive: e.target.checked }))
                    }
                  />
                  Active (show in public filters)
                </label>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    className="btn-ghost btn-sm"
                    onClick={() => setModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn-filled btn-sm"
                    disabled={saving || logoUploading}
                    onClick={save}
                  >
                    {logoUploading ? 'Uploading logo…' : saving ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </Dialog.Panel>
            </div>
          </div>
        </Dialog>
      </Transition>
      <LogoImageEditor
        isOpen={logoEditorOpen}
        imageSrc={logoEditorImage}
        filename={logoEditorFilename}
        onCancel={() => setLogoEditorOpen(false)}
        onApply={async (editedImageDataUrl, outputFilename) => {
          try {
            await uploadLogo(editedImageDataUrl, outputFilename)
            // Next edit starts from the latest saved version, not the very first raw upload.
            setLogoRawSource(editedImageDataUrl)
            setLogoEditorOpen(false)
          } catch (error) {
            alert(error instanceof Error ? error.message : 'Logo upload failed')
          }
        }}
      />
    </div>
  )
}
