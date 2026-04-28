import { useCallback, useEffect, useState, Fragment } from 'react'
import Image from 'next/image'
import { Dialog, Transition } from '@headlessui/react'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ArrowsUpDownIcon,
} from '@heroicons/react/24/outline'

type AreaRow = {
  id: string
  name: string
  nameEn: string | null
  slug: string
  description: string | null
  city: string
  image: string | null
  isActive: boolean
  sortOrder: number | null
  tags: string[]
  linkedProperties: number
}

const emptyForm = {
  nameEn: '',
  nameRu: '',
  description: '',
  city: 'Dubai',
  image: '' as string,
  isActive: true,
  sortOrder: '' as string,
  tags: '',
}

export default function AreasAdminPanel() {
  const [rows, setRows] = useState<AreaRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<'name' | 'sortOrder'>('name')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<AreaRow | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const q = new URLSearchParams({ admin: '1' })
      if (sort === 'sortOrder') q.set('sort', 'sortOrder')
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
  }, [search, sort])

  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [load])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (a: AreaRow) => {
    setEditing(a)
    const en = a.nameEn || a.name
    const ru = a.nameEn && a.name !== a.nameEn ? a.name : ''
    setForm({
      nameEn: en,
      nameRu: ru,
      description: a.description || '',
      city: a.city || 'Dubai',
      image: a.image || '',
      isActive: a.isActive,
      sortOrder: a.sortOrder != null ? String(a.sortOrder) : '',
      tags: (a.tags || []).join(', '),
    })
    setModalOpen(true)
  }

  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async () => {
      const dataUrl = reader.result as string
      try {
        const res = await fetch('/api/areas/upload-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file: dataUrl, filename: file.name }),
        })
        const json = await res.json()
        if (res.ok && json.url) setForm((f) => ({ ...f, image: json.url }))
      } catch (err) {
        console.error(err)
      }
    }
    reader.readAsDataURL(file)
  }

  const save = async () => {
    if (!form.nameEn.trim()) {
      alert('Name (EN) is required')
      return
    }
    setSaving(true)
    try {
      const tags = form.tags
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      const sortOrder =
        form.sortOrder.trim() === '' ? null : parseInt(form.sortOrder, 10)
      const payload = {
        nameEn: form.nameEn.trim(),
        nameRu: form.nameRu.trim() || null,
        description: form.description.trim() || null,
        city: form.city.trim() || 'Dubai',
        image: form.image || null,
        isActive: form.isActive,
        sortOrder: Number.isFinite(sortOrder as number) ? sortOrder : null,
        tags,
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
          <button
            type="button"
            onClick={() =>
              setSort(sort === 'name' ? 'sortOrder' : 'name')
            }
            className="inline-flex items-center gap-1 btn-outline btn-sm"
          >
            <ArrowsUpDownIcon className="h-4 w-4" />
            {sort === 'name' ? 'Sort: A–Z' : 'Sort: manual order'}
          </button>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="btn-filled btn-sm inline-flex items-center gap-1"
        >
          <PlusIcon className="h-4 w-4" />
          Add area
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
        {loading ? (
          <p className="p-6 text-gray-500">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="p-6 text-gray-500">No areas</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Name (EN)
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Name (RU)
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
              {rows.map((a) => {
                const nameRu =
                  a.nameEn && a.name !== a.nameEn ? a.name : ''
                const nameEn = a.nameEn || a.name
                return (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-graphite">
                      {nameEn}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {nameRu || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {a.sortOrder ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {a.isActive ? 'Yes' : 'No'}
                    </td>
                    <td className="px-4 py-3 text-sm">{a.linkedProperties}</td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => openEdit(a)}
                        className="inline-flex text-champagne"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(a)}
                        className="inline-flex text-red-600"
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
              <Dialog.Panel className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl space-y-4">
                <Dialog.Title className="text-lg font-semibold text-graphite">
                  {editing ? 'Edit area' : 'New area'}
                </Dialog.Title>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name (EN) *
                  </label>
                  <input
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    value={form.nameEn}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, nameEn: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name (RU)
                  </label>
                  <input
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    value={form.nameRu}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, nameRu: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    value={form.city}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, city: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    value={form.description}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, description: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags (comma-separated)
                  </label>
                  <input
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    value={form.tags}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, tags: e.target.value }))
                    }
                    placeholder="Downtown, Marina, …"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display order
                  </label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    value={form.sortOrder}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, sortOrder: e.target.value }))
                    }
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cover image
                  </label>
                  <input type="file" accept="image/*" onChange={handleImageFile} />
                  {form.image && (
                    <Image src={form.image} alt="" width={480} height={96} className="mt-2 h-24 w-full object-cover rounded-sm" unoptimized />
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
                    disabled={saving}
                    onClick={save}
                  >
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </Dialog.Panel>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  )
}
