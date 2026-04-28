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

type DeveloperRow = {
  id: string
  name: string
  nameEn: string | null
  slug: string
  logo: string | null
  description: string | null
  website: string | null
  isActive: boolean
  propertiesCount: number
}

const emptyForm = {
  nameEn: '',
  nameRu: '',
  description: '',
  website: '',
  logo: '' as string,
  isActive: true,
}

export default function DevelopersAdminPanel() {
  const [rows, setRows] = useState<DeveloperRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<'name' | 'properties'>('name')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<DeveloperRow | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [logoUploading, setLogoUploading] = useState(false)

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

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (d: DeveloperRow) => {
    setEditing(d)
    const en = d.nameEn || d.name
    const ru = d.nameEn && d.name !== d.nameEn ? d.name : ''
    setForm({
      nameEn: en,
      nameRu: ru,
      description: d.description || '',
      website: d.website || '',
      logo: d.logo || '',
      isActive: d.isActive,
    })
    setModalOpen(true)
  }

  const handleLogoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    // #region agent log
    fetch('http://127.0.0.1:7934/ingest/9cd6050e-5c73-4f29-afde-23295d7c65a1',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'c5e5a6'},body:JSON.stringify({sessionId:'c5e5a6',runId:'initial',hypothesisId:'H1',location:'src/components/admin/DevelopersAdminPanel.tsx:88',message:'Developer logo file selected',data:{name:file.name,size:file.size,type:file.type},timestamp:Date.now()})}).catch(()=>{})
    // #endregion
    const reader = new FileReader()
    reader.onload = async () => {
      const dataUrl = reader.result as string
      setLogoUploading(true)
      // #region agent log
      fetch('http://127.0.0.1:7934/ingest/9cd6050e-5c73-4f29-afde-23295d7c65a1',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'c5e5a6'},body:JSON.stringify({sessionId:'c5e5a6',runId:'post-fix',hypothesisId:'H6',location:'src/components/admin/DevelopersAdminPanel.tsx:97',message:'Developer logo upload started',data:{filename:file.name,dataUrlLength:dataUrl?.length||0},timestamp:Date.now()})}).catch(()=>{})
      // #endregion
      try {
        const res = await fetch('/api/developers/upload-logo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file: dataUrl, filename: file.name }),
        })
        const json = await res.json()
        // #region agent log
        fetch('http://127.0.0.1:7934/ingest/9cd6050e-5c73-4f29-afde-23295d7c65a1',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'c5e5a6'},body:JSON.stringify({sessionId:'c5e5a6',runId:'post-fix',hypothesisId:'H2',location:'src/components/admin/DevelopersAdminPanel.tsx:106',message:'Developer upload-logo response',data:{ok:res.ok,status:res.status,url:json?.url||null,success:json?.success??null},timestamp:Date.now()})}).catch(()=>{})
        // #endregion
        if (res.ok && json.url) setForm((f) => ({ ...f, logo: json.url }))
      } catch (err) {
        console.error(err)
      } finally {
        setLogoUploading(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const save = async () => {
    if (logoUploading) {
      // #region agent log
      fetch('http://127.0.0.1:7934/ingest/9cd6050e-5c73-4f29-afde-23295d7c65a1',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'c5e5a6'},body:JSON.stringify({sessionId:'c5e5a6',runId:'post-fix',hypothesisId:'H6',location:'src/components/admin/DevelopersAdminPanel.tsx:120',message:'Save blocked while logo upload in progress',data:{logoUploading:true},timestamp:Date.now()})}).catch(()=>{})
      // #endregion
      alert('Please wait until logo upload is complete')
      return
    }
    if (!form.nameEn.trim()) {
      alert('Name (EN) is required')
      return
    }
    setSaving(true)
    try {
      const payload = {
        nameEn: form.nameEn.trim(),
        nameRu: form.nameRu.trim() || null,
        description: form.description.trim() || null,
        website: form.website.trim() || null,
        logo: form.logo || null,
        isActive: form.isActive,
      }
      const url = editing
        ? `/api/developers/item/${editing.id}`
        : '/api/developers'
      const method = editing ? 'PUT' : 'POST'
      // #region agent log
      fetch('http://127.0.0.1:7934/ingest/9cd6050e-5c73-4f29-afde-23295d7c65a1',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'c5e5a6'},body:JSON.stringify({sessionId:'c5e5a6',runId:'post-fix',hypothesisId:'H3',location:'src/components/admin/DevelopersAdminPanel.tsx:144',message:'Developer save payload logo before submit',data:{editing:!!editing,method,logo:payload.logo||null,logoUploading},timestamp:Date.now()})}).catch(()=>{})
      // #endregion
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
                  Name (EN)
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Name (RU)
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
                const nameRu =
                  d.nameEn && d.name !== d.nameEn ? d.name : ''
                const nameEn = d.nameEn || d.name
                return (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-graphite">
                      {nameEn}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{nameRu || '—'}</td>
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
              <Dialog.Panel className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl space-y-4">
                <Dialog.Title className="text-lg font-semibold text-graphite">
                  {editing ? 'Edit developer' : 'New developer'}
                </Dialog.Title>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name (EN) *
                  </label>
                  <input
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    value={form.nameEn}
                    onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name (RU)
                  </label>
                  <input
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    value={form.nameRu}
                    onChange={(e) => setForm((f) => ({ ...f, nameRu: e.target.value }))}
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
                    Logo
                  </label>
                  <input type="file" accept="image/*" onChange={handleLogoFile} />
                  {form.logo && (
                    <Image src={form.logo} alt="" width={160} height={64} className="mt-2 h-16 object-contain" unoptimized />
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
    </div>
  )
}
