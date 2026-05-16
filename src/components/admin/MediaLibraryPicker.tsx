import { Fragment, useCallback, useEffect, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { useTranslation } from 'next-i18next/pages'
import { DocumentIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { getErrorMessage } from '@/lib/utils/errorMessage'
import type { FileWithLabel } from './FileUpload'

type MediaFolderRow = { id: string; name: string; slug: string }
type MediaAssetRow = {
  id: string
  originalName: string
  url: string
  sizeBytes: number
  mimeType: string | null
}

interface MediaLibraryPickerProps {
  open: boolean
  onClose: () => void
  onSelect: (files: FileWithLabel[]) => void
  maxSelect?: number
}

export default function MediaLibraryPicker({
  open,
  onClose,
  onSelect,
  maxSelect = 10,
}: MediaLibraryPickerProps) {
  const { t } = useTranslation('admin')
  const [folders, setFolders] = useState<MediaFolderRow[]>([])
  const [folderId, setFolderId] = useState<string | null>(null)
  const [assets, setAssets] = useState<MediaAssetRow[]>([])
  const [selected, setSelected] = useState<Record<string, MediaAssetRow>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadFolders = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/media/folders', { credentials: 'same-origin' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.ok) throw new Error(t('media.loadError'))
      const list = (data.folders || []) as MediaFolderRow[]
      setFolders(list)
      setFolderId((prev) => (prev && list.some((f) => f.id === prev) ? prev : list[0]?.id ?? null))
    } catch (err: unknown) {
      setError(getErrorMessage(err, t('media.loadError')))
    } finally {
      setLoading(false)
    }
  }, [t])

  const loadAssets = useCallback(
    async (id: string) => {
      setLoading(true)
      try {
        const res = await fetch(`/api/admin/media/assets?folderId=${encodeURIComponent(id)}`, {
          credentials: 'same-origin',
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok || !data.ok) throw new Error(t('media.loadError'))
        setAssets(data.assets || [])
      } catch (err: unknown) {
        setError(getErrorMessage(err, t('media.loadError')))
      } finally {
        setLoading(false)
      }
    },
    [t]
  )

  useEffect(() => {
    if (!open) return
    setSelected({})
    void loadFolders()
  }, [open, loadFolders])

  useEffect(() => {
    if (open && folderId) void loadAssets(folderId)
    else setAssets([])
  }, [open, folderId, loadAssets])

  const toggleAsset = (asset: MediaAssetRow) => {
    setSelected((prev) => {
      const next = { ...prev }
      if (next[asset.id]) {
        delete next[asset.id]
      } else {
        if (Object.keys(next).length >= maxSelect) return prev
        next[asset.id] = asset
      }
      return next
    })
  }

  const handleConfirm = () => {
    const picked = Object.values(selected).map(
      (asset): FileWithLabel => ({
        id: `library-${asset.id}`,
        label: asset.originalName.replace(/\.[^.]+$/, ''),
        file: null,
        url: asset.url,
        filename: asset.originalName,
        size: asset.sizeBytes,
        mimeType: asset.mimeType || undefined,
      })
    )
    onSelect(picked)
    onClose()
  }

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-[60]" onClose={onClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black/40" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-y-auto p-4">
          <div className="flex min-h-full items-center justify-center">
            <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="w-full max-w-3xl rounded-xl bg-white shadow-xl flex flex-col max-h-[85vh]">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                  <Dialog.Title className="text-lg font-semibold text-graphite">
                    {t('media.pickerTitle')}
                  </Dialog.Title>
                  <button type="button" onClick={onClose} className="p-1 text-gray-500 hover:text-gray-800">
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {error && (
                  <div className="mx-6 mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <div className="flex flex-1 min-h-0">
                  <div className="w-48 shrink-0 border-r border-gray-100 p-3 overflow-y-auto">
                    {folders.map((folder) => (
                      <button
                        key={folder.id}
                        type="button"
                        onClick={() => setFolderId(folder.id)}
                        className={`w-full text-left px-2 py-2 rounded text-sm mb-1 ${
                          folderId === folder.id ? 'bg-champagne/15 font-medium' : 'hover:bg-gray-50'
                        }`}
                      >
                        {folder.name}
                      </button>
                    ))}
                  </div>
                  <div className="flex-1 p-4 overflow-y-auto">
                    {loading ? (
                      <p className="text-sm text-gray-500">{t('media.loading')}</p>
                    ) : assets.length === 0 ? (
                      <p className="text-sm text-gray-500">{t('media.noFiles')}</p>
                    ) : (
                      <ul className="space-y-2">
                        {assets.map((asset) => {
                          const checked = Boolean(selected[asset.id])
                          return (
                            <li key={asset.id}>
                              <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${
                                checked ? 'border-champagne bg-champagne/5' : 'border-gray-200 hover:bg-gray-50'
                              }`}>
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleAsset(asset)}
                                  className="rounded border-gray-300 text-champagne focus:ring-champagne"
                                />
                                <DocumentIcon className="h-8 w-8 text-gray-400 shrink-0" />
                                <span className="text-sm font-medium text-graphite truncate">{asset.originalName}</span>
                              </label>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </div>
                </div>

                <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    {t('media.pickerSelected', { count: Object.keys(selected).length, max: maxSelect })}
                  </span>
                  <div className="flex gap-2">
                    <button type="button" className="px-4 py-2 text-sm border rounded-md" onClick={onClose}>
                      {t('form.cancel')}
                    </button>
                    <button
                      type="button"
                      disabled={Object.keys(selected).length === 0}
                      className="btn-filled text-sm disabled:opacity-50"
                      onClick={handleConfirm}
                    >
                      {t('media.pickerAttach')}
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
