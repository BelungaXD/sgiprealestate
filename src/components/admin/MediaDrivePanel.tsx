import { useCallback, useEffect, useRef, useState, FormEvent } from 'react'
import { useTranslation } from 'next-i18next/pages'
import {
  FolderPlusIcon,
  ArrowUpTrayIcon,
  TrashIcon,
  Cog6ToothIcon,
  DocumentIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { getErrorMessage } from '@/lib/utils/errorMessage'

type AdminRole = 'SUPER_ADMIN' | 'MANAGER' | 'CONTENT_EDITOR'

type MediaFolderRow = {
  id: string
  slug: string
  name: string
  isSystem: boolean
  canEdit: boolean
  canManageSettings: boolean
  viewRoles: AdminRole[]
  editRoles: AdminRole[]
}

type MediaAssetRow = {
  id: string
  originalName: string
  url: string
  sizeBytes: number
  mimeType: string | null
  createdAt: string
  canDelete: boolean
}

const ROLE_OPTIONS: AdminRole[] = ['SUPER_ADMIN', 'MANAGER', 'CONTENT_EDITOR']

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function MediaDrivePanel() {
  const { t } = useTranslation('admin')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [folders, setFolders] = useState<MediaFolderRow[]>([])
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [assets, setAssets] = useState<MediaAssetRow[]>([])
  const [canEditFolder, setCanEditFolder] = useState(false)
  const [storage, setStorage] = useState({ percent: 0, usedLabel: '', limitLabel: '' })
  const [serverDisk, setServerDisk] = useState<{
    ok: boolean
    percent: number
    usedLabel: string
    totalLabel: string
    availableLabel: string
    path: string
    host: string
  }>({ ok: false, percent: 0, usedLabel: '', totalLabel: '', availableLabel: '', path: '', host: '' })
  const [loading, setLoading] = useState(true)
  const [assetsLoading, setAssetsLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [newFolderName, setNewFolderName] = useState('')
  const [permFolder, setPermFolder] = useState<MediaFolderRow | null>(null)
  const [permView, setPermView] = useState<AdminRole[]>([])
  const [permEdit, setPermEdit] = useState<AdminRole[]>([])
  const [permSaving, setPermSaving] = useState(false)

  const loadStorage = useCallback(async () => {
    const res = await fetch('/api/admin/media/storage', { credentials: 'same-origin' })
    const data = await res.json().catch(() => ({}))
    if (res.ok && data.ok) {
      setStorage({
        percent: data.percent ?? 0,
        usedLabel: data.usedLabel ?? '',
        limitLabel: data.limitLabel ?? '',
      })
      const srv = data.server
      if (srv?.ok) {
        setServerDisk({
          ok: true,
          percent: srv.usagePercent ?? 0,
          usedLabel: srv.usedLabel ?? '',
          totalLabel: srv.totalLabel ?? '',
          availableLabel: srv.availableLabel ?? '',
          path: srv.path ?? '',
          host: srv.host ?? '',
        })
      } else {
        setServerDisk({ ok: false, percent: 0, usedLabel: '', totalLabel: '', availableLabel: '', path: '', host: '' })
      }
    }
  }, [])

  const loadFolders = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/media/folders', { credentials: 'same-origin' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.ok) throw new Error(t('media.loadError'))
      const list = (data.folders || []) as MediaFolderRow[]
      setFolders(list)
      setSelectedFolderId((prev) => {
        if (prev && list.some((f) => f.id === prev)) return prev
        return list[0]?.id ?? null
      })
    } catch (err: unknown) {
      setError(getErrorMessage(err, t('media.loadError')))
    } finally {
      setLoading(false)
    }
  }, [t])

  const loadAssets = useCallback(async (folderId: string) => {
    setAssetsLoading(true)
    try {
      const res = await fetch(`/api/admin/media/assets?folderId=${encodeURIComponent(folderId)}`, {
        credentials: 'same-origin',
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.ok) throw new Error(t('media.loadError'))
      setAssets(data.assets || [])
      setCanEditFolder(Boolean(data.canEdit))
    } catch (err: unknown) {
      setError(getErrorMessage(err, t('media.loadError')))
    } finally {
      setAssetsLoading(false)
    }
  }, [t])

  useEffect(() => {
    void loadFolders()
    void loadStorage()
  }, [loadFolders, loadStorage])

  useEffect(() => {
    if (selectedFolderId) void loadAssets(selectedFolderId)
    else setAssets([])
  }, [selectedFolderId, loadAssets])

  const selectedFolder = folders.find((f) => f.id === selectedFolderId) ?? null

  const handleCreateFolder = async (e: FormEvent) => {
    e.preventDefault()
    const name = newFolderName.trim()
    if (!name) return
    try {
      const res = await fetch('/api/admin/media/folders', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.ok) throw new Error(t('media.createFolderError'))
      setNewFolderName('')
      await loadFolders()
    } catch (err: unknown) {
      setError(getErrorMessage(err, t('media.createFolderError')))
    }
  }

  const handleUpload = async (files: FileList | File[]) => {
    if (!selectedFolderId || !canEditFolder) return
    const list = Array.from(files)
    if (list.length === 0) return
    setUploading(true)
    setError('')
    try {
      for (const file of list) {
        const dataUrl = await readFileAsDataUrl(file)
        const res = await fetch('/api/admin/media/assets', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            folderId: selectedFolderId,
            file: dataUrl,
            filename: file.name,
          }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok || !data.ok) {
          if (data.error === 'storage_limit_exceeded') {
            throw new Error(t('media.storageLimitExceeded'))
          }
          throw new Error(t('media.uploadError'))
        }
      }
      await loadAssets(selectedFolderId)
      await loadStorage()
    } catch (err: unknown) {
      setError(getErrorMessage(err, t('media.uploadError')))
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDeleteAsset = async (assetId: string) => {
    if (!confirm(t('media.deleteConfirm'))) return
    try {
      const res = await fetch('/api/admin/media/assets', {
        method: 'DELETE',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.ok) throw new Error(t('media.deleteError'))
      if (selectedFolderId) await loadAssets(selectedFolderId)
      await loadStorage()
    } catch (err: unknown) {
      setError(getErrorMessage(err, t('media.deleteError')))
    }
  }

  const openPermissions = (folder: MediaFolderRow) => {
    setPermFolder(folder)
    setPermView([...folder.viewRoles])
    setPermEdit([...folder.editRoles])
  }

  const toggleRole = (roles: AdminRole[], role: AdminRole, setter: (r: AdminRole[]) => void) => {
    if (roles.includes(role)) {
      setter(roles.filter((r) => r !== role))
    } else {
      setter([...roles, role])
    }
  }

  const savePermissions = async () => {
    if (!permFolder) return
    setPermSaving(true)
    try {
      const res = await fetch(`/api/admin/media/folders/${permFolder.id}`, {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ viewRoles: permView, editRoles: permEdit }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.ok) throw new Error(t('media.permissionsSaveError'))
      setPermFolder(null)
      await loadFolders()
    } catch (err: unknown) {
      setError(getErrorMessage(err, t('media.permissionsSaveError')))
    } finally {
      setPermSaving(false)
    }
  }

  const barClass = (percent: number) =>
    percent >= 90 ? 'bg-red-500' : percent >= 75 ? 'bg-amber-500' : 'bg-champagne'

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-sm p-6 space-y-5">
        <div>
          <h3 className="text-base font-semibold text-graphite mb-1">{t('media.title')}</h3>
          <p className="text-sm text-gray-500">{t('media.description')}</p>
        </div>

        <div>
          <div className="mb-1 flex justify-between text-xs text-gray-600">
            <span className="font-medium text-graphite">{t('media.serverDisk')}</span>
            <span>{serverDisk.ok ? `${serverDisk.percent}%` : '—'}</span>
          </div>
          {serverDisk.ok ? (
            <>
              <p className="text-xs text-gray-500 mb-2">
                {t('media.serverDiskUsed', {
                  used: serverDisk.usedLabel,
                  total: serverDisk.totalLabel,
                  free: serverDisk.availableLabel,
                })}
              </p>
              <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                <div
                  className={`h-full ${barClass(serverDisk.percent)} transition-all`}
                  style={{ width: `${serverDisk.percent}%` }}
                />
              </div>
              <p className="mt-1 text-[10px] text-gray-400 truncate">
                {serverDisk.host && t('media.serverDiskHost', { host: serverDisk.host })}
                {serverDisk.host && serverDisk.path ? ' · ' : ''}
                {serverDisk.path && (
                  <span title={serverDisk.path}>{t('media.serverDiskPath', { path: serverDisk.path })}</span>
                )}
              </p>
            </>
          ) : (
            <p className="text-xs text-gray-500">{t('media.serverDiskUnavailable')}</p>
          )}
        </div>

        <div>
          <div className="mb-1 flex justify-between text-xs text-gray-600">
            <span className="font-medium text-graphite">{t('media.libraryQuota')}</span>
            <span>{storage.percent}%</span>
          </div>
          <p className="text-xs text-gray-500 mb-2">
            {t('media.storageUsed', { used: storage.usedLabel, limit: storage.limitLabel })}
          </p>
          <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
            <div
              className={`h-full ${barClass(storage.percent)} transition-all`}
              style={{ width: `${storage.percent}%` }}
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-4 bg-white rounded-lg shadow-sm p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">{t('media.folders')}</p>
          {loading ? (
            <p className="text-sm text-gray-500">{t('media.loading')}</p>
          ) : folders.length === 0 ? (
            <p className="text-sm text-gray-500">{t('media.noFolders')}</p>
          ) : (
            <ul className="space-y-1">
              {folders.map((folder) => (
                <li key={folder.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedFolderId(folder.id)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center justify-between gap-2 ${
                      selectedFolderId === folder.id
                        ? 'bg-champagne/15 text-graphite font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="truncate">{folder.name}</span>
                    {folder.isSystem && (
                      <span className="text-[10px] uppercase text-gray-400 shrink-0">{t('media.system')}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {folders.some((f) => f.canManageSettings) && (
          <form onSubmit={handleCreateFolder} className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-2">{t('media.addFolder')}</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder={t('media.folderNamePlaceholder')}
                className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded-md"
              />
              <button type="submit" className="btn-filled px-2 py-1.5" title={t('media.addFolder')}>
                <FolderPlusIcon className="h-4 w-4" />
              </button>
            </div>
          </form>
          )}
        </div>

        <div className="lg:col-span-8 bg-white rounded-lg shadow-sm p-4 min-h-[280px]">
          {!selectedFolder ? (
            <p className="text-sm text-gray-500">{t('media.selectFolder')}</p>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div>
                  <h4 className="font-semibold text-graphite">{selectedFolder.name}</h4>
                  <p className="text-xs text-gray-500">
                    {canEditFolder ? t('media.canEdit') : t('media.viewOnly')}
                  </p>
                </div>
                <div className="flex gap-2">
                  {selectedFolder.canManageSettings && (
                    <button
                      type="button"
                      onClick={() => openPermissions(selectedFolder)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      <Cog6ToothIcon className="h-4 w-4" />
                      {t('media.permissions')}
                    </button>
                  )}
                  {canEditFolder && (
                    <>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files) void handleUpload(e.target.files)
                        }}
                      />
                      <button
                        type="button"
                        disabled={uploading}
                        onClick={() => fileInputRef.current?.click()}
                        className="btn-filled inline-flex items-center gap-1 text-sm"
                      >
                        <ArrowUpTrayIcon className="h-4 w-4" />
                        {uploading ? t('media.uploading') : t('media.upload')}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {assetsLoading ? (
                <p className="text-sm text-gray-500">{t('media.loading')}</p>
              ) : assets.length === 0 ? (
                <p className="text-sm text-gray-500">{t('media.noFiles')}</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {assets.map((asset) => (
                    <li key={asset.id} className="flex items-center gap-3 py-3">
                      <DocumentIcon className="h-8 w-8 text-gray-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-graphite truncate">{asset.originalName}</p>
                        <p className="text-xs text-gray-500">{formatSize(asset.sizeBytes)}</p>
                      </div>
                      <a
                        href={asset.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-600 hover:text-champagne"
                        title={t('media.download')}
                      >
                        <ArrowDownTrayIcon className="h-5 w-5" />
                      </a>
                      {asset.canDelete && (
                        <button
                          type="button"
                          onClick={() => void handleDeleteAsset(asset.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-md"
                          title={t('media.delete')}
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </div>

      <Transition appear show={!!permFolder} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setPermFolder(null)}>
          <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/30" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
                  <Dialog.Title className="text-lg font-semibold text-graphite mb-2">
                    {t('media.permissionsTitle', { name: permFolder?.name || '' })}
                  </Dialog.Title>

                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">{t('media.viewRoles')}</p>
                      <div className="flex flex-wrap gap-2">
                        {ROLE_OPTIONS.map((role) => (
                          <label key={`v-${role}`} className="inline-flex items-center gap-1 text-sm">
                            <input
                              type="checkbox"
                              checked={permView.includes(role)}
                              onChange={() => toggleRole(permView, role, setPermView)}
                            />
                            {t(`settings.roles.${role}`)}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">{t('media.editRoles')}</p>
                      <div className="flex flex-wrap gap-2">
                        {ROLE_OPTIONS.map((role) => (
                          <label key={`e-${role}`} className="inline-flex items-center gap-1 text-sm">
                            <input
                              type="checkbox"
                              checked={permEdit.includes(role)}
                              onChange={() => toggleRole(permEdit, role, setPermEdit)}
                            />
                            {t(`settings.roles.${role}`)}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end gap-2">
                    <button type="button" className="px-4 py-2 text-sm border rounded-md" onClick={() => setPermFolder(null)}>
                      {t('form.cancel')}
                    </button>
                    <button type="button" disabled={permSaving} className="btn-filled text-sm" onClick={() => void savePermissions()}>
                      {permSaving ? t('settings.saving') : t('form.save')}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  )
}
