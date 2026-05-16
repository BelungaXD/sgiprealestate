import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  Fragment,
  type ReactNode,
} from 'react'
import Image from 'next/image'
import { Dialog, Transition } from '@headlessui/react'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  XMarkIcon,
  FolderOpenIcon,
  StarIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline'
import { convertToWebP } from './ImageUpload'
import MediaLibraryPicker from './MediaLibraryPicker'
import type { FileWithLabel } from './FileUpload'
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

type TranslateApiResponse = {
  translations?: Partial<Record<ContentLocale, string[]>>
  message?: string
}

async function fetchTranslations(
  texts: string[],
  sourceLocale: ContentLocale,
  textKind: 'listing' | 'area' = 'listing'
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

const AREA_MAX_DEPTH = 3

type AreaLevel = 'city' | 'district' | 'community'

const AREA_LEVEL_OPTIONS: { value: AreaLevel; label: string; depth: number }[] = [
  { value: 'city', label: 'City', depth: 1 },
  { value: 'district', label: 'District', depth: 2 },
  { value: 'community', label: 'Sub-district / Community', depth: 3 },
]

function levelFromDepth(depth: number): AreaLevel {
  if (depth <= 1) return 'city'
  if (depth === 2) return 'district'
  return 'community'
}

function parentDepthForLevel(level: AreaLevel): number | null {
  if (level === 'city') return null
  if (level === 'district') return 1
  return 2
}

type AreaImageRow = {
  id?: string
  url: string
  alt?: string | null
  order?: number
  isMain?: boolean
}

type AreaRow = {
  id: string
  name: string
  nameEn: string | null
  nameRu?: string | null
  nameAr?: string | null
  slug: string
  description: string | null
  descriptionEn?: string | null
  descriptionRu?: string | null
  descriptionAr?: string | null
  city: string
  image: string | null
  images?: AreaImageRow[]
  mapEmbed?: string | null
  parentId?: string | null
  isActive: boolean
  sortOrder: number | null
  tags: string[]
  tagsRu?: string[]
  tagsAr?: string[]
  linkedProperties: number
}

type TreeNode = AreaRow & { children: TreeNode[]; depth: number }

const emptyForm = {
  name: '',
  description: '',
  descriptionRu: '',
  descriptionAr: '',
  city: 'Dubai',
  image: '' as string,
  isActive: true,
  sortOrder: '' as string,
  tags: [] as string[],
  tagsRu: [] as string[],
  tagsAr: [] as string[],
  areaLevel: 'city' as AreaLevel,
  parentId: '' as string,
  mapEmbed: '' as string,
  images: [] as AreaImageRow[],
}

function AreaPhotoDropzone({
  label,
  hint,
  uploading,
  disabled,
  multiple,
  onPickFiles,
  extraAction,
}: {
  label: string
  hint: string
  uploading: boolean
  disabled?: boolean
  multiple?: boolean
  onPickFiles: (files: FileList | File[]) => void
  extraAction?: ReactNode
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'))
    if (files.length) onPickFiles(files)
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="block text-sm font-medium text-gray-700">{label}</span>
        {extraAction}
      </div>
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
        onDragOver={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
        onDrop={onDrop}
        onClick={() => !disabled && !uploading && inputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          disabled || uploading
            ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-70'
            : 'border-gray-300 hover:border-champagne cursor-pointer bg-gray-50/50 hover:bg-champagne/5'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple={multiple}
          className="hidden"
          disabled={disabled || uploading}
          onChange={(e) => {
            if (e.target.files?.length) onPickFiles(e.target.files)
            e.target.value = ''
          }}
        />
        <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-3 text-sm font-medium text-champagne">
          {uploading ? 'Uploading…' : 'Click to add photos'}
        </p>
        <p className="mt-1 text-xs text-gray-500">{hint}</p>
        {!uploading && !disabled && (
          <p className="mt-2 text-xs text-gray-400">or drag and drop images here</p>
        )}
      </div>
    </div>
  )
}

function buildTree(rows: AreaRow[]): TreeNode[] {
  const byId = new Map<string, TreeNode>()
  rows.forEach((r) => byId.set(r.id, { ...r, children: [], depth: 1 }))
  const roots: TreeNode[] = []
  byId.forEach((node) => {
    if (node.parentId && byId.has(node.parentId)) {
      const parent = byId.get(node.parentId)!
      node.depth = parent.depth + 1
      parent.children.push(node)
    } else {
      roots.push(node)
    }
  })
  const sortFn = (a: TreeNode, b: TreeNode) => {
    const ao = a.sortOrder ?? Number.POSITIVE_INFINITY
    const bo = b.sortOrder ?? Number.POSITIVE_INFINITY
    if (ao !== bo) return ao - bo
    return (a.nameEn || a.name).localeCompare(b.nameEn || b.name)
  }
  const sortRec = (nodes: TreeNode[]) => {
    nodes.sort(sortFn)
    nodes.forEach((n) => sortRec(n.children))
  }
  sortRec(roots)
  return roots
}

function collectDescendantIds(node: TreeNode, into: Set<string>) {
  for (const child of node.children) {
    into.add(child.id)
    collectDescendantIds(child, into)
  }
}

function subtreeMaxDepth(node: TreeNode): number {
  if (node.children.length === 0) return 1
  return 1 + Math.max(...node.children.map(subtreeMaxDepth))
}

export default function AreasAdminPanel() {
  const [rows, setRows] = useState<AreaRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<AreaRow | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [coverUploading, setCoverUploading] = useState(false)
  const [galleryUploading, setGalleryUploading] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [newTag, setNewTag] = useState('')
  const [localeEditorTab, setLocaleEditorTab] = useState<ContentLocale>('en')
  const [translateStatus, setTranslateStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [translateError, setTranslateError] = useState('')
  const [tagTranslateBusy, setTagTranslateBusy] = useState(false)
  const localeSnapshotsRef = useRef<Record<ContentLocale, LocaleSnapshot>>(
    buildLocaleSnapshots({})
  )
  const isApplyingTranslation = useRef(false)
  const translateRequestSeq = useRef(0)

  const tagLists: Record<ContentLocale, string[]> = {
    en: form.tags,
    ru: form.tagsRu,
    ar: form.tagsAr,
  }

  const applyTagLists = (next: Record<ContentLocale, string[]>) => {
    setForm((f) => ({
      ...f,
      tags: next.en,
      tagsRu: next.ru,
      tagsAr: next.ar,
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
    const source = findEditedSourceLocale(current, localeSnapshotsRef.current)
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
          const translations = await fetchTranslations([descriptionTrimmed], source, 'area')
          if (requestId !== translateRequestSeq.current) return
          isApplyingTranslation.current = true
          for (const locale of otherLocales(source)) {
            const translated = (translations[locale]?.[0] ?? '').trim()
            setDescriptionForLocale(locale, translated)
          }
          localeSnapshotsRef.current = buildLocaleSnapshots({
            description: form.description,
            descriptionRu: form.descriptionRu,
            descriptionAr: form.descriptionAr,
          })
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
      const q = new URLSearchParams({ admin: '1' })
      if (search.trim()) q.set('search', search.trim())
      const res = await fetch(`/api/areas?${q}`)
      const data = await res.json()
      setRows(data.areas || [])
    } catch (e) {
      console.error(e)
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [load])

  const tree = useMemo(() => buildTree(rows), [rows])

  const flat = useMemo(() => {
    const out: { node: TreeNode; path: string[] }[] = []
    const walk = (nodes: TreeNode[], path: string[]) => {
      for (const n of nodes) {
        const segment = n.nameEn || n.name
        const nextPath = [...path, segment]
        out.push({ node: n, path: nextPath })
        if (!collapsed[n.id]) walk(n.children, nextPath)
      }
    }
    walk(tree, [])
    return out
  }, [tree, collapsed])

  const treeById = useMemo(() => {
    const map = new Map<string, TreeNode>()
    const walk = (nodes: TreeNode[]) => {
      for (const n of nodes) {
        map.set(n.id, n)
        walk(n.children)
      }
    }
    walk(tree)
    return map
  }, [tree])

  const parentOptionsForLevel = useMemo(() => {
    if (!modalOpen || form.areaLevel === 'city') return []
    const requiredParentDepth = parentDepthForLevel(form.areaLevel)
    if (!requiredParentDepth) return []

    const excluded = new Set<string>()
    if (editing) {
      excluded.add(editing.id)
      const node = treeById.get(editing.id)
      if (node) collectDescendantIds(node, excluded)
    }

    const out: { id: string; label: string }[] = []
    for (const row of rows) {
      const node = treeById.get(row.id)
      if (!node || node.depth !== requiredParentDepth || excluded.has(node.id)) continue
      const name = node.nameEn || node.name
      if (requiredParentDepth === 1) {
        out.push({ id: node.id, label: name })
      } else {
        const city = node.parentId ? treeById.get(node.parentId) : null
        const cityName = city ? city.nameEn || city.name : ''
        out.push({
          id: node.id,
          label: cityName ? `${cityName} → ${name}` : name,
        })
      }
    }
    out.sort((a, b) => a.label.localeCompare(b.label))
    return out
  }, [modalOpen, form.areaLevel, editing, rows, treeById])

  const appendTagWithTranslation = async (source: ContentLocale, trimmed: string) => {
    const snapshot: Record<ContentLocale, string[]> = {
      en: [...form.tags],
      ru: [...form.tagsRu],
      ar: [...form.tagsAr],
    }

    setTagTranslateBusy(true)
    setTranslateStatus('loading')
    setTranslateError('')
    try {
      const translations = await fetchTranslations([trimmed], source, 'area')
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
      applyTagLists(next)
      setTranslateStatus('idle')
    } catch (err: unknown) {
      setTranslateStatus('error')
      setTranslateError(getErrorMessage(err, 'Tag translation failed'))
    } finally {
      setTagTranslateBusy(false)
    }
  }

  const openCreate = (parentId?: string | null) => {
    setEditing(null)
    setNewTag('')
    setLocaleEditorTab('en')
    setTranslateStatus('idle')
    setTranslateError('')
    localeSnapshotsRef.current = buildLocaleSnapshots({})
    let areaLevel: AreaLevel = 'city'
    let pid = ''
    if (parentId) {
      const parentNode = treeById.get(parentId)
      if (parentNode?.depth === 1) {
        areaLevel = 'district'
        pid = parentId
      } else if (parentNode?.depth === 2) {
        areaLevel = 'community'
        pid = parentId
      }
    }
    setForm({
      ...emptyForm,
      areaLevel,
      parentId: pid,
      city: parentId ? rows.find((r) => r.id === parentId)?.city || 'Dubai' : 'Dubai',
    })
    setModalOpen(true)
  }

  const openEdit = (a: AreaRow) => {
    setEditing(a)
    setNewTag('')
    const node = treeById.get(a.id)
    const areaLevel = node ? levelFromDepth(node.depth) : 'city'
    const descriptionEn = (a.description || a.descriptionEn || '').trim()
    const nextForm = {
      name: (a.nameEn || a.name || '').trim(),
      description: descriptionEn,
      descriptionRu: (a.descriptionRu || '').trim(),
      descriptionAr: (a.descriptionAr || '').trim(),
      city: a.city || 'Dubai',
      image: a.image || '',
      isActive: a.isActive,
      sortOrder: a.sortOrder != null ? String(a.sortOrder) : '',
      tags: [...(a.tags || [])],
      tagsRu: [...(a.tagsRu || [])],
      tagsAr: [...(a.tagsAr || [])],
      areaLevel,
      parentId: a.parentId || '',
      mapEmbed: a.mapEmbed || '',
      images: (a.images || []).map((img) => ({
        url: img.url,
        alt: img.alt || '',
        order: img.order ?? 0,
        isMain: !!img.isMain,
      })),
    }
    setForm(nextForm)
    setLocaleEditorTab('en')
    setTranslateStatus('idle')
    setTranslateError('')
    localeSnapshotsRef.current = buildLocaleSnapshots(nextForm)
    setModalOpen(true)
  }

  const addTag = () => {
    const trimmed = newTag.trim()
    if (!trimmed || tagTranslateBusy) return
    setNewTag('')
    void appendTagWithTranslation(localeEditorTab, trimmed)
  }

  const removeTag = (index: number) => {
    const next = { ...tagLists, [localeEditorTab]: tagLists[localeEditorTab].filter((_, i) => i !== index) }
    applyTagLists(next)
  }

  const uploadOneImage = async (file: File): Promise<string | null> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = async () => {
        try {
          let uploadData = reader.result as string
          let uploadFilename = file.name
          try {
            uploadData = await convertToWebP(file)
            uploadFilename = `${file.name.replace(/\.[^/.]+$/, '')}.webp`
          } catch (e) {
            console.error('Area image conversion failed; using original', e)
          }
          const res = await fetch('/api/areas/upload-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ file: uploadData, filename: uploadFilename }),
          })
          const json = await res.json().catch(() => ({}))
          if (res.ok && json.url) {
            resolve(json.url as string)
            return
          }
          alert(json?.message || 'Image upload failed')
          resolve(null)
        } catch (err) {
          console.error(err)
          alert('Image upload request failed')
          reject(err)
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const handleCoverFiles = async (files: FileList | File[]) => {
    const file = Array.from(files)[0]
    if (!file) return
    setCoverUploading(true)
    try {
      const url = await uploadOneImage(file)
      if (url) setForm((f) => ({ ...f, image: url }))
    } finally {
      setCoverUploading(false)
    }
  }

  const handleGalleryFiles = async (files: FileList | File[]) => {
    const list = Array.from(files)
    if (list.length === 0) return
    setGalleryUploading(true)
    try {
      const added: AreaImageRow[] = []
      for (const file of list) {
        const url = await uploadOneImage(file)
        if (url) added.push({ url, alt: '', order: form.images.length + added.length })
      }
      if (added.length) {
        setForm((f) => ({
          ...f,
          images: [...f.images, ...added].map((img, idx) => ({ ...img, order: idx })),
        }))
      }
    } finally {
      setGalleryUploading(false)
    }
  }

  const handleLibraryPick = (picked: FileWithLabel[]) => {
    const additions: AreaImageRow[] = picked
      .filter((p) => Boolean(p.url))
      .map((p, idx) => ({
        url: p.url as string,
        alt: p.label || '',
        order: form.images.length + idx,
      }))
    if (additions.length === 0) return
    setForm((f) => ({
      ...f,
      images: [...f.images, ...additions].map((img, idx) => ({ ...img, order: idx })),
    }))
  }

  const removeGalleryImage = (index: number) => {
    setForm((f) => ({
      ...f,
      images: f.images
        .filter((_, i) => i !== index)
        .map((img, idx) => ({ ...img, order: idx })),
    }))
  }

  const setMainImage = (index: number) => {
    setForm((f) => ({
      ...f,
      images: f.images.map((img, i) => ({ ...img, isMain: i === index })),
    }))
  }

  const save = async () => {
    if (coverUploading || galleryUploading) {
      alert('Please wait until image upload is complete')
      return
    }
    if (!form.name.trim()) {
      alert('Name is required')
      return
    }
    if (form.areaLevel !== 'city' && !form.parentId) {
      alert(
        form.areaLevel === 'district'
          ? 'Please select a parent city'
          : 'Please select a parent district'
      )
      return
    }
    setSaving(true)
    try {
      const sortOrder =
        form.sortOrder.trim() === '' ? null : parseInt(form.sortOrder, 10)
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        descriptionRu: form.descriptionRu.trim() || null,
        descriptionAr: form.descriptionAr.trim() || null,
        city: form.city.trim() || 'Dubai',
        image: form.image || null,
        isActive: form.isActive,
        sortOrder: Number.isFinite(sortOrder as number) ? sortOrder : null,
        tags: form.tags,
        tagsRu: form.tagsRu,
        tagsAr: form.tagsAr,
        parentId: form.areaLevel === 'city' ? null : form.parentId || null,
        mapEmbed: form.mapEmbed.trim() || null,
        images: form.images.map((img, idx) => ({
          url: img.url,
          alt: img.alt || null,
          order: idx,
          isMain: !!img.isMain,
        })),
      }
      const url = editing ? `/api/areas/item/${editing.id}` : '/api/areas'
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || 'Save failed')
      }
      setModalOpen(false)
      await load()
    } catch (e: unknown) {
      alert((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const remove = async (a: AreaRow) => {
    const node = treeById.get(a.id)
    const childCount = node?.children.length || 0
    if (childCount > 0) {
      if (
        !confirm(
          `${childCount} sub-area(s) will be promoted one level up. Continue?`
        )
      ) {
        return
      }
    }
    const res = await fetch(`/api/areas/item/${a.id}`, { method: 'DELETE' })
    if (res.ok) {
      load()
      return
    }
    if (res.status === 409) {
      const data = await res.json()
      const n = data.linkedProperties ?? 0
      if (
        !confirm(
          `${n} listing(s) use this area. Unlink area from those listings and delete?`
        )
      ) {
        return
      }
      const res2 = await fetch(`/api/areas/item/${a.id}?force=1`, {
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

  const toggleCollapse = (id: string) =>
    setCollapsed((c) => ({ ...c, [id]: !c[id] }))

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
              placeholder="Search areas..."
              className="pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm w-64"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={() => openCreate(null)}
          className="btn-filled btn-sm inline-flex items-center gap-1"
        >
          <PlusIcon className="h-4 w-4" />
          Add city
        </button>
      </div>

      <p className="text-xs text-gray-500">
        Hierarchy: City → District → Sub-district / Community (max {AREA_MAX_DEPTH} levels).
      </p>

      <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
        {loading ? (
          <p className="p-6 text-gray-500">Loading…</p>
        ) : flat.length === 0 ? (
          <p className="p-6 text-gray-500">No areas</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  City
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Order
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
              {flat.map(({ node }) => {
                const displayName = node.nameEn || node.name
                const hasChildren = node.children.length > 0
                const canAddChild = node.depth < AREA_MAX_DEPTH
                return (
                  <tr key={node.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">
                      <div
                        className="flex items-center gap-1"
                        style={{ paddingLeft: `${(node.depth - 1) * 20}px` }}
                      >
                        {hasChildren ? (
                          <button
                            type="button"
                            onClick={() => toggleCollapse(node.id)}
                            className="text-gray-400 hover:text-gray-700"
                          >
                            {collapsed[node.id] ? (
                              <ChevronRightIcon className="h-4 w-4" />
                            ) : (
                              <ChevronDownIcon className="h-4 w-4" />
                            )}
                          </button>
                        ) : (
                          <span className="inline-block w-4" />
                        )}
                        <div>
                          <div className="font-medium text-graphite">{displayName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {node.city || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {node.sortOrder ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {node.isActive ? 'Yes' : 'No'}
                    </td>
                    <td className="px-4 py-3 text-sm">{node.linkedProperties}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex flex-wrap items-center justify-end gap-1">
                        {canAddChild && (
                          <button
                            type="button"
                            title="Add sub-area"
                            aria-label="Add sub-area"
                            onClick={() => openCreate(node.id)}
                            className="p-1.5 rounded-md text-champagne hover:text-graphite hover:bg-champagne/15 cursor-pointer"
                          >
                            <PlusIcon className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          title="Edit"
                          aria-label="Edit"
                          onClick={() => openEdit(node)}
                          className="p-1.5 rounded-md text-champagne hover:text-graphite hover:bg-champagne/15 cursor-pointer"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          title="Delete"
                          aria-label="Delete"
                          onClick={() => remove(node)}
                          className="p-1.5 rounded-md text-red-600 hover:text-red-800 hover:bg-red-50 cursor-pointer"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
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
              <Dialog.Panel className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
                <Dialog.Title className="text-lg font-semibold text-graphite">
                  {editing ? 'Edit area' : 'New area'}
                </Dialog.Title>

                <div className="rounded-lg border border-gray-200 bg-gray-50/80 p-4 space-y-3">
                  <p className="text-sm font-medium text-graphite">Location in hierarchy</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Level *
                      </label>
                      <select
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
                        value={form.areaLevel}
                        onChange={(e) => {
                          const areaLevel = e.target.value as AreaLevel
                          setForm((f) => ({
                            ...f,
                            areaLevel,
                            parentId: '',
                          }))
                        }}
                      >
                        {AREA_LEVEL_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City label (filters &amp; SEO)
                      </label>
                      <input
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
                        value={form.city}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, city: e.target.value }))
                        }
                        placeholder="Dubai"
                      />
                    </div>
                  </div>
                  {form.areaLevel === 'district' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Parent city *
                      </label>
                      <select
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
                        value={form.parentId}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            parentId: e.target.value,
                            city:
                              rows.find((r) => r.id === e.target.value)?.city || f.city,
                          }))
                        }
                      >
                        <option value="">Select city…</option>
                        {parentOptionsForLevel.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      {parentOptionsForLevel.length === 0 && (
                        <p className="mt-1 text-xs text-amber-700">
                          Add a city first, then you can add districts under it.
                        </p>
                      )}
                    </div>
                  )}
                  {form.areaLevel === 'community' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Parent district *
                      </label>
                      <select
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
                        value={form.parentId}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            parentId: e.target.value,
                            city:
                              rows.find((r) => r.id === e.target.value)?.city || f.city,
                          }))
                        }
                      >
                        <option value="">Select district…</option>
                        {parentOptionsForLevel.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      {parentOptionsForLevel.length === 0 && (
                        <p className="mt-1 text-xs text-amber-700">
                          Add a district first, then you can add communities under it.
                        </p>
                      )}
                    </div>
                  )}
                  {form.areaLevel === 'city' && (
                    <p className="text-xs text-gray-500">
                      Cities are top-level areas (e.g. Dubai). Add districts and communities
                      from the + button in the list.
                    </p>
                  )}
                </div>


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
                      onChange={(e) => setDescriptionForLocale(localeEditorTab, e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_11rem] gap-x-3 gap-y-2">
                    <label className="order-1 md:order-none block text-sm font-medium text-gray-700 md:row-start-1 md:col-start-1">
                      Tags
                    </label>
                    <label className="order-4 md:order-none block text-sm font-medium text-gray-700 md:row-start-1 md:col-start-2">
                      Display order
                    </label>
                    <div className="order-2 md:order-none flex gap-2 items-stretch md:row-start-2 md:col-start-1">
                      <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            addTag()
                          }
                        }}
                        placeholder="Add tag (translates to all languages)"
                        disabled={tagTranslateBusy}
                        className="min-w-0 flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-hidden focus:ring-champagne focus:border-champagne"
                      />
                      <button
                        type="button"
                        onClick={addTag}
                        disabled={tagTranslateBusy}
                        className="btn-filled btn-sm shrink-0 self-stretch px-4"
                      >
                        Add
                      </button>
                    </div>
                    <input
                      type="number"
                      className="order-5 md:order-none w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-hidden focus:ring-champagne focus:border-champagne md:row-start-2 md:col-start-2"
                      value={form.sortOrder}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, sortOrder: e.target.value }))
                      }
                      placeholder="Optional"
                    />
                    <div className="order-3 md:order-none flex flex-wrap gap-2 min-h-[2rem] md:row-start-3 md:col-span-2">
                      {tagLists[localeEditorTab].map((tag, index) => (
                        <span
                          key={`${tag}-${index}`}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-champagne/20 text-champagne rounded-full text-sm"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(index)}
                            className="text-champagne hover:text-red-600"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Google Maps URL / embed link
                  </label>
                  <input
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    value={form.mapEmbed}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, mapEmbed: e.target.value }))
                    }
                    placeholder="https://www.google.com/maps/embed?…"
                  />
                </div>



                <AreaPhotoDropzone
                  label="Cover image"
                  hint="One photo used as the area thumbnail in listings"
                  uploading={coverUploading}
                  onPickFiles={handleCoverFiles}
                />
                {form.image && (
                  <Image
                    src={form.image}
                    alt=""
                    width={480}
                    height={96}
                    className="h-24 w-full object-cover rounded-sm border border-gray-200"
                    unoptimized
                  />
                )}

                <div>
                  <AreaPhotoDropzone
                    label="Gallery"
                    hint="Photos shown on the public area page — add several at once"
                    uploading={galleryUploading}
                    multiple
                    onPickFiles={handleGalleryFiles}
                    extraAction={
                      <button
                        type="button"
                        onClick={() => setPickerOpen(true)}
                        className="inline-flex items-center gap-1 text-sm text-champagne hover:text-champagne/80"
                      >
                        <FolderOpenIcon className="h-4 w-4" />
                        Media Library
                      </button>
                    }
                  />
                  {form.images.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
                      {form.images.map((img, idx) => (
                        <div key={`${img.url}-${idx}`} className="relative group">
                          <Image
                            src={img.url}
                            alt={img.alt || ''}
                            width={240}
                            height={140}
                            className={`w-full h-28 object-cover rounded-sm border ${
                              img.isMain ? 'border-champagne' : 'border-gray-200'
                            }`}
                            unoptimized
                          />
                          <button
                            type="button"
                            title={img.isMain ? 'Main image' : 'Make main'}
                            onClick={() => setMainImage(idx)}
                            className={`absolute top-1 left-1 rounded-full p-1 ${
                              img.isMain
                                ? 'bg-champagne text-white'
                                : 'bg-white/80 text-gray-600 hover:bg-white'
                            }`}
                          >
                            <StarIcon className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeGalleryImage(idx)}
                            className="absolute top-1 right-1 rounded-full p-1 bg-white/80 text-red-500 hover:bg-white"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
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
                    disabled={saving || coverUploading || galleryUploading}
                    onClick={save}
                  >
                    {coverUploading || galleryUploading
                      ? 'Uploading image…'
                      : saving
                        ? 'Saving…'
                        : 'Save'}
                  </button>
                </div>
              </Dialog.Panel>
            </div>
          </div>
        </Dialog>
      </Transition>

      <MediaLibraryPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleLibraryPick}
        maxSelect={Math.max(1, 30 - form.images.length)}
      />
    </div>
  )
}
