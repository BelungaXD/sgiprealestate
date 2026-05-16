import { useState, useEffect, useCallback, Fragment, FormEvent } from 'react'
import { useTranslation } from 'next-i18next/pages'
import Image from 'next/image'
import { Dialog, Transition } from '@headlessui/react'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ArrowLeftOnRectangleIcon,
  HomeIcon,
  BuildingOfficeIcon,
  UsersIcon,
  UserPlusIcon,
  FolderOpenIcon,
  FolderIcon,
  ChevronUpIcon,
  XMarkIcon,
  MapPinIcon,
  BuildingLibraryIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline'
import PropertyModal from './PropertyModal'
import FolderImport from './FolderImport'
import DevelopersAdminPanel from './DevelopersAdminPanel'
import AreasAdminPanel from './AreasAdminPanel'
import SettingsPanel from './SettingsPanel'
import { PropertyFormData, pickPropertyApiPayload } from '@/lib/validations/property'
import { FileWithLabel } from './FileUpload'
import { getErrorMessage } from '@/lib/utils/errorMessage'
import { uploadUrlCompareKey } from '@/lib/utils/imageUrl'

function resolveSettingsUsersError(
  error: unknown,
  t: (key: string) => string,
  fallback: string
): string {
  if (error instanceof Error && error.message) {
    const key = `settings.errors.${error.message}`
    const translated = t(key)
    if (translated !== key) return translated
  }
  return getErrorMessage(error, fallback)
}

interface AdminDashboardProps {
  onLogout: () => void
  sessionUser: AdminSessionUser | null
  visibleTabs: string[]
}

type AdminRole = 'SUPER_ADMIN' | 'MANAGER' | 'CONTENT_EDITOR'

interface AdminSessionUser {
  id: string | null
  email: string | null
  name: string | null
  role: AdminRole
  isEnvBootstrap?: boolean
}

interface AdminUser {
  id: string
  email: string
  name: string | null
  role: AdminRole
  isActive: boolean
  lastLoginAt: string | null
  avatarUrl: string | null
  passwordSetAt: string | null
  inviteExpiresAt: string | null
  createdAt: string
  updatedAt: string
}

interface DashboardPropertyFile {
  id?: string
  label?: string
  url?: string
  filename?: string
  size?: number
  mimeType?: string
}

interface DashboardPropertyImage {
  url?: string
}

interface DashboardProperty {
  id: string
  title: string
  price: number
  currency: string
  status: string
  views?: number
  images?: Array<string | DashboardPropertyImage>
  files?: DashboardPropertyFile[]
  [key: string]: unknown
}

interface AdminInquiry {
  id: string
  name: string
  email: string
  phone: string | null
  message: string | null
  source: string | null
  page: string | null
  status: string
  notes: string | null
  assignedAdminId: string | null
  createdAt: string
}

const INQUIRY_STATUSES = [
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'PROPOSAL',
  'NEGOTIATION',
  'CLOSED_WON',
  'CLOSED_LOST',
] as const
type InquiryStatusFilter = 'ALL' | (typeof INQUIRY_STATUSES)[number]

function inquiryStatusBadgeClass(status: string): string {
  switch (status) {
    case 'NEW':
      return 'bg-blue-100 text-blue-800'
    case 'CONTACTED':
      return 'bg-indigo-100 text-indigo-800'
    case 'QUALIFIED':
      return 'bg-purple-100 text-purple-800'
    case 'PROPOSAL':
      return 'bg-cyan-100 text-cyan-800'
    case 'NEGOTIATION':
      return 'bg-amber-100 text-amber-800'
    case 'CLOSED_WON':
      return 'bg-green-100 text-green-800'
    case 'CLOSED_LOST':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const ADMIN_ROLE_OPTIONS: AdminRole[] = ['SUPER_ADMIN', 'MANAGER', 'CONTENT_EDITOR']

function teamInitials(name: string | null, email: string): string {
  const source = (name || email).trim()
  const parts = source.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase()
  return source.slice(0, 2).toUpperCase()
}

function formatTeamLastLogin(iso: string | null, locale: string, neverLabel: string): string {
  if (!iso) return neverLabel
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return neverLabel
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  const diffSec = Math.round((date.getTime() - Date.now()) / 1000)
  const abs = Math.abs(diffSec)
  if (abs < 60) return rtf.format(diffSec, 'second')
  if (abs < 3600) return rtf.format(Math.round(diffSec / 60), 'minute')
  if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), 'hour')
  if (abs < 86400 * 30) return rtf.format(Math.round(diffSec / 86400), 'day')
  return date.toLocaleString(locale)
}

export default function AdminDashboard({ onLogout, sessionUser, visibleTabs }: AdminDashboardProps) {
  const { t, i18n } = useTranslation('admin')
  const [activeTab, setActiveTab] = useState(visibleTabs[0] || 'properties')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProperty, setEditingProperty] = useState<DashboardProperty | null>(null)
  const [properties, setProperties] = useState<DashboardProperty[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    views: 0,
    leads: 0,
  })

  // Import folder into existing property
  const [importFolderProperty, setImportFolderProperty] = useState<DashboardProperty | null>(null)
  const [importFolderPath, setImportFolderPath] = useState('')
  const [importFolderLoading, setImportFolderLoading] = useState(false)
  const [browseOpen, setBrowseOpen] = useState(false)
  const [browseRoots, setBrowseRoots] = useState<{ name: string; path: string }[]>([])
  const [browseFolders, setBrowseFolders] = useState<{ name: string; path: string }[]>([])
  const [browseParentPath, setBrowseParentPath] = useState<string | null>(null)
  const [browseCurrentPath, setBrowseCurrentPath] = useState('')
  const [browseLoading, setBrowseLoading] = useState(false)
  const [browseError, setBrowseError] = useState<string | null>(null)
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [usersSaving, setUsersSaving] = useState(false)
  const [usersError, setUsersError] = useState('')
  const [newUserForm, setNewUserForm] = useState({
    email: '',
    name: '',
    role: 'MANAGER' as AdminRole,
  })
  const [inviteLinkModal, setInviteLinkModal] = useState<{
    email: string
    inviteUrl: string
    emailSent: boolean
  } | null>(null)
  const [editTeamMember, setEditTeamMember] = useState<AdminUser | null>(null)
  const [editTeamForm, setEditTeamForm] = useState({
    name: '',
    role: 'MANAGER' as AdminRole,
    isActive: true,
  })
  const [resetPasswordModal, setResetPasswordModal] = useState<{
    email: string
    password: string
  } | null>(null)
  const [serverStorageUsagePercent, setServerStorageUsagePercent] = useState<number | null>(null)
  const [inquiries, setInquiries] = useState<AdminInquiry[]>([])
  const [inquiriesLoading, setInquiriesLoading] = useState(false)
  const [inquiriesError, setInquiriesError] = useState('')
  const [inquirySavingId, setInquirySavingId] = useState<string | null>(null)
  const [inquiryStatusFilter, setInquiryStatusFilter] = useState<InquiryStatusFilter>('ALL')

  const loadBrowse = useCallback(async (path: string | null) => {
    setBrowseLoading(true)
    setBrowseError(null)
    try {
      const q = path ? `?path=${encodeURIComponent(path)}` : ''
      const res = await fetch(`/api/properties/browse-folders${q}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || data.error || 'Failed to load')
      setBrowseRoots(data.roots || [])
      setBrowseFolders(data.folders || [])
      setBrowseParentPath(data.parentPath ?? null)
      setBrowseCurrentPath(data.currentPath ?? (path || ''))
    } catch (e: unknown) {
      setBrowseError((e as Error).message)
      setBrowseRoots([])
      setBrowseFolders([])
      setBrowseParentPath(null)
    } finally {
      setBrowseLoading(false)
    }
  }, [])

  const openImportFolderModal = (property: DashboardProperty) => {
    setImportFolderProperty(property)
    setImportFolderPath('')
    setImportFolderLoading(false)
  }

  const openBrowseForImport = () => {
    setBrowseOpen(true)
    setBrowseCurrentPath('')
    loadBrowse(null)
  }

  const selectBrowseForImport = (path: string) => {
    setImportFolderPath(path)
    setBrowseOpen(false)
  }

  const handleImportFolderIntoProperty = async () => {
    if (!importFolderProperty || !importFolderPath.trim()) return
    setImportFolderLoading(true)
    try {
      const res = await fetch('/api/properties/import-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderPath: importFolderPath.trim(), propertyId: importFolderProperty.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || data.error || 'Import failed')
      setImportFolderProperty(null)
      setImportFolderPath('')
      await loadProperties()
      alert(data.message || 'Folder imported.')
    } catch (e: unknown) {
      alert((e as Error).message)
    } finally {
      setImportFolderLoading(false)
    }
  }

  // Load properties from API
  const loadProperties = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/properties?limit=100')
      const data = await response.json()
      
      if (data.properties) {
        setProperties(data.properties)
        setStats({
          total: data.total || 0,
          active: data.properties.filter((p: DashboardProperty) => p.status === 'AVAILABLE').length,
          views: 0, // TODO: Add views tracking
          leads: 0, // TODO: Add leads tracking
        })
      }
    } catch (error) {
      console.error('Error loading properties:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleFolderImportComplete = useCallback(async (createdPropertyId?: string) => {
    await loadProperties()
    if (!createdPropertyId) return
    try {
      const response = await fetch(`/api/properties/${encodeURIComponent(createdPropertyId)}`)
      if (!response.ok) return
      const data = await response.json()
      if (!data?.property) return
      setEditingProperty(data.property)
      setIsModalOpen(true)
    } catch (error) {
      console.error('Error opening newly imported property:', error)
    }
  }, [loadProperties])

  const loadAdminUsers = useCallback(async () => {
    setUsersLoading(true)
    setUsersError('')
    try {
      const response = await fetch('/api/admin/users', { credentials: 'same-origin' })
      const data = (await response.json().catch(() => ({}))) as {
        ok?: boolean
        users?: AdminUser[]
        error?: string
      }
      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Failed to load users')
      }

      setAdminUsers(data.users || [])
    } catch (error: unknown) {
      console.error('Error loading admin users:', error)
      setUsersError(t('settings.loadError'))
    } finally {
      setUsersLoading(false)
    }
  }, [t])

  const loadInquiries = useCallback(async () => {
    setInquiriesLoading(true)
    setInquiriesError('')
    try {
      const response = await fetch('/api/admin/inquiries', { credentials: 'same-origin' })
      const data = (await response.json().catch(() => ({}))) as {
        ok?: boolean
        inquiries?: AdminInquiry[]
        error?: string
      }
      if (!response.ok || !data.ok) {
        throw new Error('Failed to load inquiries')
      }
      setInquiries(data.inquiries || [])
    } catch (error) {
      console.error('Error loading inquiries:', error)
      setInquiriesError('Failed to load inquiries')
      setInquiries([])
    } finally {
      setInquiriesLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!visibleTabs.includes(activeTab)) {
      setActiveTab(visibleTabs[0] || 'properties')
    }
  }, [activeTab, visibleTabs])

  useEffect(() => {
    loadProperties()
  }, [loadProperties])

  useEffect(() => {
    if (sessionUser?.role !== 'SUPER_ADMIN') {
      setServerStorageUsagePercent(null)
      return
    }
    const loadServerStorageUsage = async () => {
      try {
        const response = await fetch('/api/admin/server-storage', { credentials: 'same-origin' })
        const data = (await response.json().catch(() => ({}))) as {
          ok?: boolean
          usagePercent?: number
        }

        if (!response.ok || !data.ok || typeof data.usagePercent !== 'number') {
          setServerStorageUsagePercent(null)
          return
        }

        setServerStorageUsagePercent(Math.round(data.usagePercent))
      } catch (error) {
        console.error('Error loading server storage usage:', error)
        setServerStorageUsagePercent(null)
      }
    }

    loadServerStorageUsage()
  }, [sessionUser?.role])

  useEffect(() => {
    if (activeTab === 'settings' && sessionUser?.role === 'SUPER_ADMIN') {
      loadAdminUsers()
    }
    if (activeTab === 'inquiries') {
      loadInquiries()
      if (sessionUser?.role === 'SUPER_ADMIN' && adminUsers.length === 0) {
        loadAdminUsers()
      }
    }
  }, [activeTab, loadAdminUsers, loadInquiries, sessionUser?.role, adminUsers.length])

  const statsData = [
    { name: t('dashboard.totalProperties'), value: stats.total.toString(), icon: BuildingOfficeIcon, color: 'text-blue-600' },
    { name: t('dashboard.activeListings'), value: stats.active.toString(), icon: HomeIcon, color: 'text-green-600' },
    { name: t('dashboard.totalViews'), value: stats.views.toString(), icon: EyeIcon, color: 'text-purple-600' },
    { name: t('dashboard.leads'), value: stats.leads.toString(), icon: UsersIcon, color: 'text-champagne' }
  ]

  const handleAddProperty = () => {
    setEditingProperty(null)
    setIsModalOpen(true)
  }

  const handleEditProperty = async (property: DashboardProperty) => {
    try {
      // Load full property data with all images and files
      const response = await fetch(`/api/properties/${property.id}`)
      if (response.ok) {
        const data = await response.json()
        setEditingProperty(data.property)
      } else {
        // Fallback to property from list if API fails
        setEditingProperty(property)
      }
    } catch (error) {
      console.error('Error loading property details:', error)
      // Fallback to property from list if API fails
    setEditingProperty(property)
    }
    setIsModalOpen(true)
  }

  const handleDeleteProperty = async (id: string) => {
    if (!confirm('Are you sure you want to delete this property?')) {
      return
    }

    try {
      const response = await fetch(`/api/properties/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await loadProperties()
      } else {
        let detail = `HTTP ${response.status}`
        try {
          const data = await response.json()
          if (data && typeof data.message === 'string' && data.message) {
            detail = data.message
          }
        } catch {
          /* ignore */
        }
        alert(detail)
      }
    } catch (error) {
      console.error('Error deleting property:', error)
      alert(error instanceof Error ? error.message : 'Error deleting property')
    }
  }

  const handleDeleteAllProperties = async () => {
    if (!confirm('⚠️ WARNING: Are you sure you want to delete ALL properties? This action cannot be undone!')) {
      return
    }

    if (!confirm('Do you really want to delete all properties? Click OK to confirm.')) {
      return
    }

    try {
      const response = await fetch('/api/properties/delete-all', {
        method: 'DELETE',
      })

      const result = await response.json()

      if (response.ok && result.success) {
        alert(`Deleted ${result.count} properties`)
        await loadProperties()
      } else {
        alert(result.message || 'Error deleting properties')
      }
    } catch (error) {
      console.error('Error deleting properties:', error)
      alert('Error deleting properties')
    }
  }

  const handleSaveProperty = async (data: PropertyFormData & { images: string[]; files: FileWithLabel[] }) => {
    try {
      const embedded = (data.images || []).some(
        (i) => typeof i === 'string' && i.startsWith('data:')
      )
      if (embedded) {
        throw new Error(
          'Gallery still contains raw uploads (data URLs). Wait for each file to finish uploading, or remove those rows.'
        )
      }

      const url = editingProperty
        ? `/api/properties/${encodeURIComponent(String(editingProperty.id))}`
        : '/api/properties'

      const method = editingProperty ? 'PUT' : 'POST'

      const mappedFiles = (data.files || []).map((f) => ({
        id: f.id,
        label: f.label,
        url: f.url,
        filename: f.filename,
        size: f.size,
        mimeType: f.mimeType,
      }))

      const payload: Record<string, unknown> = pickPropertyApiPayload({
        ...data,
        files: mappedFiles,
      })

      if (method === 'PUT' && editingProperty) {
        const prevImg = (editingProperty.images || []).map(
          (img: { url?: string } | string) =>
            typeof img === 'string' ? img : img?.url ?? ''
        )
        const nextImg = data.images || []
        const imagesSame =
          prevImg.length === nextImg.length &&
                   prevImg.every(
            (u: string, i: number) =>
              uploadUrlCompareKey(u) === uploadUrlCompareKey(nextImg[i] ?? '')
          )
        if (imagesSame) {
          delete payload.images
        }

        const ef = editingProperty.files || []
        const df = data.files || []
        const filesSame =
          ef.length === df.length &&
          ef.every(
            (pf: { label?: string; url?: string }, i: number) =>
              pf.label === df[i]?.label &&
              uploadUrlCompareKey(pf.url) === uploadUrlCompareKey(df[i]?.url)
          )
        if (filesSame) {
          delete payload.files
        }
      }

      let body: string
      try {
        body = JSON.stringify(payload)
      } catch {
        throw new Error('Could not serialize the form. Check for invalid values and try again.')
      }
      if (body.length > 4_500_000) {
        throw new Error(
          'Request is too large to save in one step. Change fewer images at once or contact support.'
        )
      }

      const response = await fetch(url, {
        method,
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
        },
        body,
      })

      if (!response.ok) {
        let errorMessage = 'Error saving property'
        try {
          const contentType = response.headers.get('content-type')
          if (contentType && contentType.includes('application/json')) {
            const error = await response.json()
            if (Array.isArray(error.errors) && error.errors.length > 0) {
              errorMessage = error.errors
                .map(
                  (e: { path?: string[]; message?: string }) =>
                    `${e.path?.length ? e.path.join('.') : 'field'}: ${e.message || 'invalid'}`
                )
                .join('; ')
            } else {
              errorMessage = error.message || errorMessage
              if (
                process.env.NODE_ENV === 'development' &&
                typeof error.error === 'string' &&
                error.error.trim()
              ) {
                errorMessage = `${errorMessage} (${error.error})`
              }
            }
          } else {
            errorMessage = `Server error: ${response.status} ${response.statusText}`
          }
        } catch {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      // Parse successful response
      const contentType = response.headers.get('content-type')
      let result: { success?: boolean; message?: string; property?: { id?: string } } = {}
      if (contentType && contentType.includes('application/json')) {
        result = await response.json()
        // Handle both success: true/false formats
        if (result.success === false) {
          throw new Error(result.message || 'Error saving property')
        }
        // Log demo mode silently (database may be temporarily unavailable)
        if (result.message && result.message.includes('demo mode') && result.message.includes('database not configured')) {
          console.warn('Database temporarily unavailable, property saved in demo mode:', result.message)
        }
      }

      // Reload properties to show the new one
      await loadProperties()
      
      // Check if property was actually saved (has real ID, not demo)
      const isDemoMode = result.message && result.message.includes('demo mode')
      const isRealProperty = result.property && result.property.id && !result.property.id.startsWith('demo-')
      
      if (isDemoMode) {
        // In demo mode, property is not saved to database
        // Don't close modal - user needs to configure database
        console.warn('Property not saved - database not configured')
      } else if (isRealProperty || response.ok) {
        // Property was saved successfully
        setIsModalOpen(false)
        setEditingProperty(null)
      } else {
        // Unknown state - close modal anyway
        setIsModalOpen(false)
        setEditingProperty(null)
      }
    } catch (error: unknown) {
      console.error('Error saving property:', error)
      throw error
    }
  }

  const handleCreateAdminUser = async (e: FormEvent) => {
    e.preventDefault()
    setUsersSaving(true)
    setUsersError('')
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newUserForm.email.trim(),
          name: newUserForm.name.trim() || undefined,
          role: newUserForm.role,
        }),
      })

      const data = (await response.json().catch(() => ({}))) as {
        ok?: boolean
        error?: string
        inviteUrl?: string
        emailSent?: boolean
      }

      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'failed_to_create_user')
      }

      const invitedEmail = newUserForm.email.trim()
      setNewUserForm({ email: '', name: '', role: 'MANAGER' })
      if (data.inviteUrl) {
        setInviteLinkModal({
          email: invitedEmail,
          inviteUrl: data.inviteUrl,
          emailSent: Boolean(data.emailSent),
        })
      }
      await loadAdminUsers()
    } catch (error: unknown) {
      setUsersError(resolveSettingsUsersError(error, t, t('settings.createError')))
    } finally {
      setUsersSaving(false)
    }
  }

  const patchTeamMember = async (
    id: string,
    body: Record<string, unknown>
  ): Promise<{ temporaryPassword?: string; inviteUrl?: string; emailSent?: boolean }> => {
    const response = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = (await response.json().catch(() => ({}))) as {
      ok?: boolean
      error?: string
      temporaryPassword?: string
      inviteUrl?: string
      emailSent?: boolean
    }
    if (!response.ok || !data.ok) {
      throw new Error(data.error || t('settings.updateError'))
    }
    return {
      temporaryPassword: data.temporaryPassword,
      inviteUrl: data.inviteUrl,
      emailSent: data.emailSent,
    }
  }

  const handleSaveTeamEdit = async () => {
    if (!editTeamMember) return
    setUsersSaving(true)
    setUsersError('')
    try {
      await patchTeamMember(editTeamMember.id, {
        name: editTeamForm.name.trim() || null,
        role: editTeamForm.role,
        isActive: editTeamForm.isActive,
      })
      setEditTeamMember(null)
      await loadAdminUsers()
    } catch (error: unknown) {
      setUsersError(resolveSettingsUsersError(error, t, t('settings.updateError')))
    } finally {
      setUsersSaving(false)
    }
  }

  const handleRemoveTeamMember = async (user: AdminUser) => {
    const pendingInvite = !user.passwordSetAt
    const confirmMessage = pendingInvite
      ? t('settings.removeInviteConfirm', { email: user.email })
      : t('settings.deactivateConfirm', { email: user.email })
    if (!confirm(confirmMessage)) return

    setUsersSaving(true)
    setUsersError('')
    try {
      if (pendingInvite) {
        const response = await fetch(`/api/admin/users/${user.id}`, {
          method: 'DELETE',
          credentials: 'same-origin',
        })
        const data = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string }
        if (!response.ok || !data.ok) {
          throw new Error(data.error || 'failed_to_delete_user')
        }
      } else {
        await patchTeamMember(user.id, { isActive: false })
      }
      await loadAdminUsers()
    } catch (error: unknown) {
      setUsersError(
        resolveSettingsUsersError(
          error,
          t,
          pendingInvite ? t('settings.removeInviteError') : t('settings.deactivateError')
        )
      )
    } finally {
      setUsersSaving(false)
    }
  }

  const handleActivateTeamMember = async (user: AdminUser) => {
    setUsersSaving(true)
    setUsersError('')
    try {
      await patchTeamMember(user.id, { isActive: true })
      await loadAdminUsers()
    } catch (error: unknown) {
      setUsersError(resolveSettingsUsersError(error, t, t('settings.updateError')))
    } finally {
      setUsersSaving(false)
    }
  }

  const handleResendInvite = async (user: AdminUser) => {
    setUsersSaving(true)
    setUsersError('')
    try {
      const result = await patchTeamMember(user.id, { resendInvite: true })
      if (result.inviteUrl) {
        setInviteLinkModal({
          email: user.email,
          inviteUrl: result.inviteUrl,
          emailSent: Boolean(result.emailSent),
        })
      }
      await loadAdminUsers()
    } catch (error: unknown) {
      setUsersError(resolveSettingsUsersError(error, t, t('settings.inviteResendError')))
    } finally {
      setUsersSaving(false)
    }
  }

  const handleResetTeamPassword = async (user: AdminUser) => {
    if (!confirm(t('settings.resetPasswordConfirm', { email: user.email }))) return
    setUsersSaving(true)
    setUsersError('')
    try {
      const result = await patchTeamMember(user.id, { resetPassword: true })
      if (result.temporaryPassword) {
        setResetPasswordModal({ email: user.email, password: result.temporaryPassword })
      }
    } catch (error: unknown) {
      setUsersError(resolveSettingsUsersError(error, t, t('settings.resetPasswordError')))
    } finally {
      setUsersSaving(false)
    }
  }

  const patchInquiry = async (
    inquiryId: string,
    body: Record<string, unknown>
  ): Promise<void> => {
    setInquirySavingId(inquiryId)
    try {
      const response = await fetch(`/api/admin/inquiries/${inquiryId}`, {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok || !data.ok) {
        throw new Error('Failed to update inquiry')
      }
      await loadInquiries()
    } catch (error) {
      console.error('Error updating inquiry:', error)
      alert('Failed to update inquiry')
    } finally {
      setInquirySavingId(null)
    }
  }

  const handleUpdateInquiry = (inquiryId: string, status: string, notes: string) =>
    patchInquiry(inquiryId, { status, notes })

  const handleAssignInquiry = (inquiryId: string, assignedAdminId: string | null) =>
    patchInquiry(inquiryId, { assignedAdminId })

  const handleDeleteInquiry = async (id: string) => {
    if (!confirm('Delete this inquiry?')) return
    setInquirySavingId(id)
    try {
      const response = await fetch(`/api/admin/inquiries/${id}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok || !data.ok) {
        throw new Error('Failed to delete inquiry')
      }
      await loadInquiries()
    } catch (error) {
      console.error('Error deleting inquiry:', error)
      alert('Failed to delete inquiry')
    } finally {
      setInquirySavingId(null)
    }
  }

  const allTabs = [
    { id: 'properties', name: t('dashboard.properties'), icon: BuildingOfficeIcon },
    { id: 'areas', name: t('dashboard.areas'), icon: MapPinIcon },
    { id: 'developers', name: t('dashboard.developers'), icon: BuildingLibraryIcon },
    { id: 'inquiries', name: t('dashboard.inquiries'), icon: UsersIcon },
    { id: 'settings', name: t('dashboard.settings'), icon: FolderIcon },
  ]
  const tabs = allTabs.filter((tab) => visibleTabs.includes(tab.id))
  const canManageTeam = sessionUser?.role === 'SUPER_ADMIN'
  const canAccessMedia = visibleTabs.includes('settings')
  const canManageIntegrations = sessionUser?.role === 'SUPER_ADMIN'
  const canOpenSettings = canManageTeam || canAccessMedia

  return (
    <div className="admin-shell min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative h-16 w-16 shrink-0">
                <Image
                  src="/images/sgip_logo.png"
                  alt="SGIP"
                  width={64}
                  height={64}
                  sizes="64px"
                  className="h-14 w-14 object-contain rounded-xl mx-auto"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-graphite">{t('dashboard.title')}</h1>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeftOnRectangleIcon className="h-5 w-5" />
              <span>{t('dashboard.logout')}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-xs min-h-screen">
          <nav className="mt-8">
            {tabs.map((tab) => {
              const IconComponent = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-6 py-3 text-left hover:bg-gray-50 transition-colors ${
                    activeTab === tab.id ? 'bg-champagne/10 text-champagne border-r-2 border-champagne' : 'text-gray-700'
                  }`}
                >
                  <IconComponent className="h-5 w-5" />
                  <span>{tab.name}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          {typeof serverStorageUsagePercent === 'number' && serverStorageUsagePercent >= 80 && (
            <div
              className={`mb-6 rounded-lg border px-4 py-3 text-sm ${
                serverStorageUsagePercent >= 90
                  ? 'border-red-300 bg-red-50 text-red-800'
                  : 'border-yellow-300 bg-yellow-50 text-yellow-800'
              }`}
            >
              {t('dashboard.serverUsageWarning', { percent: serverStorageUsagePercent })}
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {statsData.map((stat, index) => {
              const IconComponent = stat.icon
              return (
                <div key={index} className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center">
                    <div className={`p-3 rounded-lg bg-gray-50 ${stat.color}`}>
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                      <p className="text-2xl font-bold text-graphite">{stat.value}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Content based on active tab */}
          {activeTab === 'properties' && (
            <div className="space-y-6">
              {/* Folder Import Section */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <FolderImport onImportComplete={handleFolderImportComplete} />
                <div className="mt-4">
                  <div className="mx-auto flex w-fit flex-col items-center">
                    <button
                      onClick={handleAddProperty}
                      className="inline-flex items-center justify-center space-x-2 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                    >
                      <PlusIcon className="h-4 w-4" />
                      <span>{t('properties.addProperty')}</span>
                    </button>
                    <span className="mt-1 text-[11px] text-gray-400">
                      Optional manual fallback
                    </span>
                  </div>
                </div>
              </div>
              
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-graphite">{t('properties.title')}</h2>
                  <div className="flex items-center space-x-2">
                    {properties.length > 0 && (
                      <button
                        onClick={handleDeleteAllProperties}
                        className="btn-danger btn-sm"
                        title="Delete all properties"
                      >
                        Delete All
                      </button>
                    )}
                  </div>
                </div>
              </div>
              {loading ? (
                <div className="p-8 text-center text-gray-500">Loading...</div>
              ) : properties.length === 0 ? (
                <div className="p-8 text-center text-gray-500">{t('properties.noProperties')}</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('properties.property')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('properties.price')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('properties.status')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('properties.views')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('properties.actions')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {properties.map((property) => (
                        <tr key={property.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-graphite">{property.title}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {property.currency} {property.price.toLocaleString('en-US')}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              property.status === 'AVAILABLE' 
                                ? 'bg-green-100 text-green-800' 
                                : property.status === 'SOLD'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {property.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {property.views || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex flex-wrap items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleEditProperty(property)}
                                aria-label={t('properties.edit', { defaultValue: 'Edit' })}
                                title={t('properties.edit', { defaultValue: 'Edit' })}
                                className="p-1.5 rounded-md text-champagne hover:text-graphite hover:bg-champagne/15 cursor-pointer"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => openImportFolderModal(property)}
                                aria-label={t('properties.importFolder', { defaultValue: 'Import folder' })}
                                title={t('properties.importFolder', { defaultValue: 'Import folder into this property' })}
                                className="p-1.5 rounded-md text-blue-600 hover:text-blue-800 hover:bg-blue-50 cursor-pointer"
                              >
                                <FolderOpenIcon className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteProperty(property.id)}
                                aria-label={t('properties.delete', { defaultValue: 'Delete' })}
                                title={t('properties.delete', { defaultValue: 'Delete' })}
                                className="p-1.5 rounded-md text-red-600 hover:text-red-800 hover:bg-red-50 cursor-pointer"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              </div>
            </div>
          )}

          {activeTab === 'developers' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-graphite mb-4">
                {t('developers.title')}
              </h2>
              <DevelopersAdminPanel />
            </div>
          )}

          {activeTab === 'areas' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-graphite mb-4">
                {t('areas.title')}
              </h2>
              <AreasAdminPanel />
            </div>
          )}

          {activeTab === 'inquiries' && (() => {
            const counts: Record<InquiryStatusFilter, number> = {
              ALL: inquiries.length,
              NEW: 0,
              CONTACTED: 0,
              QUALIFIED: 0,
              PROPOSAL: 0,
              NEGOTIATION: 0,
              CLOSED_WON: 0,
              CLOSED_LOST: 0,
            }
            for (const inq of inquiries) {
              if (inq.status in counts) {
                counts[inq.status as InquiryStatusFilter] += 1
              }
            }
            const filteredInquiries =
              inquiryStatusFilter === 'ALL'
                ? inquiries
                : inquiries.filter((inq) => inq.status === inquiryStatusFilter)
            const statusTabs: InquiryStatusFilter[] = ['ALL', ...INQUIRY_STATUSES]
            const canAssign = sessionUser?.role === 'SUPER_ADMIN'
            const assignableAdmins = adminUsers.filter((a) => a.isActive)
            const adminNameById = (id: string | null): string => {
              if (!id) return ''
              const found = adminUsers.find((a) => a.id === id)
              return found ? found.name || found.email : id
            }
            return (
              <div className="bg-white rounded-lg shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-graphite">
                    {t('inquiries.title', { defaultValue: 'Inquiries' })}
                  </h2>
                  <button onClick={loadInquiries} className="btn-outline btn-sm">
                    {t('inquiries.refresh', { defaultValue: 'Refresh' })}
                  </button>
                </div>
                <nav className="px-6 pt-3 flex flex-wrap gap-1 border-b border-gray-100">
                  {statusTabs.map((status) => {
                    const active = inquiryStatusFilter === status
                    return (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setInquiryStatusFilter(status)}
                        className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors ${
                          active
                            ? 'border-champagne text-champagne'
                            : 'border-transparent text-gray-600 hover:text-graphite hover:border-gray-300'
                        }`}
                      >
                        <span>
                          {t(`inquiries.statuses.${status}`, {
                            defaultValue: status === 'ALL' ? 'All' : status,
                          })}
                        </span>
                        <span
                          className={`inline-flex min-w-[1.5rem] justify-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                            active ? 'bg-champagne/20 text-champagne' : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {counts[status]}
                        </span>
                      </button>
                    )
                  })}
                </nav>
                {inquiriesError && <p className="px-6 py-3 text-sm text-red-600">{inquiriesError}</p>}
                {inquiriesLoading ? (
                  <p className="p-6 text-sm text-gray-500">
                    {t('inquiries.loading', { defaultValue: 'Loading inquiries…' })}
                  </p>
                ) : filteredInquiries.length === 0 ? (
                  <p className="p-6 text-sm text-gray-500">
                    {t('inquiries.empty', { defaultValue: 'No inquiries in this status.' })}
                  </p>
                ) : (
                  <div className="space-y-4 p-6">
                    {filteredInquiries.map((inquiry) => (
                      <div key={inquiry.id} className="rounded-lg border border-gray-200 p-4 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-sm font-semibold text-graphite truncate">
                                {inquiry.name}
                              </h3>
                              <span
                                className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${inquiryStatusBadgeClass(inquiry.status)}`}
                              >
                                {t(`inquiries.statuses.${inquiry.status}`, {
                                  defaultValue: inquiry.status,
                                })}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 truncate">
                              {inquiry.email}
                              {inquiry.phone ? ` • ${inquiry.phone}` : ''}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(inquiry.createdAt).toLocaleString()} •{' '}
                              {inquiry.source || 'web'} • {inquiry.page || 'unknown page'}
                            </p>
                          </div>
                          {canAssign && (
                            <button
                              type="button"
                              className="text-xs text-red-600 hover:text-red-900"
                              disabled={inquirySavingId === inquiry.id}
                              onClick={() => handleDeleteInquiry(inquiry.id)}
                            >
                              {t('inquiries.delete', { defaultValue: 'Delete' })}
                            </button>
                          )}
                        </div>
                        {inquiry.message && (
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">
                            {inquiry.message}
                          </p>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              {t('inquiries.statusLabel', { defaultValue: 'Status' })}
                            </label>
                            <select
                              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                              value={inquiry.status}
                              onChange={(e) =>
                                handleUpdateInquiry(
                                  inquiry.id,
                                  e.target.value,
                                  inquiry.notes || ''
                                )
                              }
                              disabled={inquirySavingId === inquiry.id}
                            >
                              {INQUIRY_STATUSES.map((status) => (
                                <option key={status} value={status}>
                                  {t(`inquiries.statuses.${status}`, { defaultValue: status })}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              {t('inquiries.assignedTo', { defaultValue: 'Assigned to' })}
                            </label>
                            {canAssign ? (
                              <select
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                                value={inquiry.assignedAdminId || ''}
                                onChange={(e) =>
                                  handleAssignInquiry(inquiry.id, e.target.value || null)
                                }
                                disabled={inquirySavingId === inquiry.id}
                              >
                                <option value="">
                                  {t('inquiries.unassigned', { defaultValue: 'Unassigned' })}
                                </option>
                                {assignableAdmins.map((admin) => (
                                  <option key={admin.id} value={admin.id}>
                                    {admin.name || admin.email}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <p className="px-3 py-2 text-sm text-gray-700">
                                {inquiry.assignedAdminId
                                  ? adminNameById(inquiry.assignedAdminId)
                                  : t('inquiries.unassigned', { defaultValue: 'Unassigned' })}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              {t('inquiries.notesLabel', { defaultValue: 'Notes' })}
                            </label>
                            <input
                              type="text"
                              defaultValue={inquiry.notes || ''}
                              placeholder={t('inquiries.notesPlaceholder', {
                                defaultValue: 'Notes',
                              })}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                              onBlur={(e) =>
                                handleUpdateInquiry(inquiry.id, inquiry.status, e.target.value)
                              }
                              disabled={inquirySavingId === inquiry.id}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })()}

          {activeTab === 'settings' && canOpenSettings && (
            <SettingsPanel
              showTeam={canManageTeam}
              showMedia={canAccessMedia}
              showIntegrations={canManageIntegrations}
              teamSection={
            <div className="space-y-6">
              {usersError && (
                <div
                  role="alert"
                  className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {usersError}
                </div>
              )}

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <UserPlusIcon className="h-5 w-5 text-champagne" />
                  <h3 className="text-base font-semibold text-graphite">{t('settings.addPeople')}</h3>
                </div>

                <form onSubmit={handleCreateAdminUser} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="email"
                    required
                    value={newUserForm.email}
                    onChange={(e) => setNewUserForm((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder={t('settings.emailPlaceholder')}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-champagne focus:border-champagne"
                  />
                  <input
                    type="text"
                    value={newUserForm.name}
                    onChange={(e) => setNewUserForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder={t('settings.namePlaceholder')}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-champagne focus:border-champagne"
                  />
                  <select
                    value={newUserForm.role}
                    onChange={(e) =>
                      setNewUserForm((prev) => ({ ...prev, role: e.target.value as AdminRole }))
                    }
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-champagne focus:border-champagne"
                    aria-label={t('settings.roleLabel')}
                  >
                    {ADMIN_ROLE_OPTIONS.map((role) => (
                      <option key={role} value={role}>
                        {t(`settings.roles.${role}`)}
                      </option>
                    ))}
                  </select>
                  <div className="md:col-span-3">
                    <button
                      type="submit"
                      disabled={usersSaving}
                      className="btn-filled inline-flex items-center space-x-2"
                    >
                      <UserPlusIcon className="h-4 w-4" />
                      <span>{usersSaving ? t('settings.saving') : t('settings.sendInvite')}</span>
                    </button>
                  </div>
                </form>
              </div>

              <div className="bg-white rounded-lg shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-base font-semibold text-graphite">{t('settings.peopleList')}</h3>
                </div>
                {usersLoading ? (
                  <div className="p-6 text-sm text-gray-500">{t('settings.loadingUsers')}</div>
                ) : adminUsers.length === 0 ? (
                  <div className="p-6 text-sm text-gray-500">{t('settings.noUsers')}</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t('settings.member')}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t('settings.roleLabel')}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t('settings.statusLabel')}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t('settings.lastLogin')}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t('settings.actions')}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {adminUsers.map((user) => (
                          <tr key={user.id} className={!user.isActive ? 'bg-gray-50/80' : undefined}>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${
                                    user.isActive
                                      ? 'bg-champagne/20 text-graphite'
                                      : 'bg-gray-200 text-gray-500'
                                  }`}
                                >
                                  {teamInitials(user.name, user.email)}
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-graphite">
                                    {user.name || user.email}
                                  </div>
                                  {user.name && (
                                    <div className="text-xs text-gray-500">{user.email}</div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-700">
                              {t(`settings.roles.${user.role}`)}
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                                  !user.passwordSetAt
                                    ? 'bg-amber-100 text-amber-800'
                                    : user.isActive
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-gray-200 text-gray-600'
                                }`}
                              >
                                {!user.passwordSetAt
                                  ? t('settings.statusInvitePending')
                                  : user.isActive
                                    ? t('settings.statusActive')
                                    : t('settings.statusInactive')}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                              {formatTeamLastLogin(
                                user.lastLoginAt,
                                i18n.language || 'en',
                                t('settings.lastLoginNever')
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-wrap items-center gap-1">
                                {!user.passwordSetAt && (
                                  <button
                                    type="button"
                                    disabled={usersSaving}
                                    onClick={() => handleResendInvite(user)}
                                    aria-label={t('settings.resendInvite')}
                                    title={t('settings.resendInvite')}
                                    className="p-1.5 rounded-md text-champagne hover:text-graphite hover:bg-champagne/15 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    <PaperAirplaneIcon className="h-4 w-4" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  disabled={usersSaving}
                                  onClick={() => {
                                    setEditTeamMember(user)
                                    setEditTeamForm({
                                      name: user.name || '',
                                      role: user.role,
                                      isActive: user.isActive,
                                    })
                                  }}
                                  aria-label={t('settings.edit')}
                                  title={t('settings.edit')}
                                  className="p-1.5 rounded-md text-champagne hover:text-graphite hover:bg-champagne/15 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <PencilIcon className="h-4 w-4" />
                                </button>
                                {user.passwordSetAt && !user.isActive ? (
                                  <button
                                    type="button"
                                    disabled={usersSaving}
                                    onClick={() => handleActivateTeamMember(user)}
                                    className="px-2 py-1 text-xs font-medium text-green-700 hover:text-green-900 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {t('settings.activate')}
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    disabled={usersSaving}
                                    onClick={() => handleRemoveTeamMember(user)}
                                    aria-label={
                                      user.passwordSetAt
                                        ? t('settings.deactivate')
                                        : t('settings.removeInvite')
                                    }
                                    title={
                                      user.passwordSetAt
                                        ? t('settings.deactivate')
                                        : t('settings.removeInvite')
                                    }
                                    className="p-1.5 rounded-md text-red-600 hover:text-red-800 hover:bg-red-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </button>
                                )}
                                {user.passwordSetAt && (
                                  <button
                                    type="button"
                                    disabled={usersSaving}
                                    onClick={() => handleResetTeamPassword(user)}
                                    className="text-gray-600 hover:text-gray-900 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {t('settings.resetPassword')}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
              }
            />
          )}
        </div>
      </div>

      <Transition appear show={!!editTeamMember} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setEditTeamMember(null)}>
          <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/30" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
                  <Dialog.Title className="text-lg font-semibold text-graphite mb-4">
                    {t('settings.editMember')}
                  </Dialog.Title>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editTeamForm.name}
                      onChange={(e) => setEditTeamForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder={t('settings.namePlaceholder')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                    <select
                      value={editTeamForm.role}
                      onChange={(e) =>
                        setEditTeamForm((f) => ({ ...f, role: e.target.value as AdminRole }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      {ADMIN_ROLE_OPTIONS.map((role) => (
                        <option key={role} value={role}>
                          {t(`settings.roles.${role}`)}
                        </option>
                      ))}
                    </select>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={editTeamForm.isActive}
                        onChange={(e) =>
                          setEditTeamForm((f) => ({ ...f, isActive: e.target.checked }))
                        }
                        className="rounded border-gray-300 text-champagne focus:ring-champagne"
                      />
                      {t('settings.statusActive')}
                    </label>
                  </div>
                  <div className="mt-6 flex justify-end gap-2">
                    <button type="button" onClick={() => setEditTeamMember(null)} className="btn-ghost btn-sm">
                      {t('form.cancel')}
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveTeamEdit}
                      disabled={usersSaving}
                      className="btn-filled btn-sm"
                    >
                      {usersSaving ? t('settings.saving') : t('form.save')}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      <Transition appear show={!!inviteLinkModal} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setInviteLinkModal(null)}>
          <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/30" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
                  <Dialog.Title className="text-lg font-semibold text-graphite mb-2">
                    {inviteLinkModal?.emailSent
                      ? t('settings.inviteSentTitle')
                      : t('settings.inviteLinkTitle')}
                  </Dialog.Title>
                  <p className="text-sm text-gray-600 mb-3">
                    {inviteLinkModal?.emailSent
                      ? t('settings.inviteSentBody', { email: inviteLinkModal.email })
                      : t('settings.inviteLinkBody', { email: inviteLinkModal?.email || '' })}
                  </p>
                  <p className="text-sm font-mono bg-gray-100 rounded-md px-3 py-2 break-all mb-3">
                    {inviteLinkModal?.inviteUrl}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="btn-outline btn-sm flex-1"
                      onClick={() => {
                        if (inviteLinkModal?.inviteUrl) {
                          void navigator.clipboard.writeText(inviteLinkModal.inviteUrl)
                        }
                      }}
                    >
                      {t('settings.copyInviteLink')}
                    </button>
                    <button
                      type="button"
                      className="btn-filled btn-sm"
                      onClick={() => setInviteLinkModal(null)}
                    >
                      OK
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      <Transition appear show={!!resetPasswordModal} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setResetPasswordModal(null)}>
          <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/30" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
                  <Dialog.Title className="text-lg font-semibold text-graphite mb-2">
                    {t('settings.resetPasswordDone')}
                  </Dialog.Title>
                  <p className="text-sm text-gray-600 mb-3">{resetPasswordModal?.email}</p>
                  <p className="text-sm font-mono bg-gray-100 rounded-md px-3 py-2 break-all">
                    {resetPasswordModal?.password}
                  </p>
                  <button
                    type="button"
                    className="btn-filled btn-sm mt-4 w-full"
                    onClick={() => setResetPasswordModal(null)}
                  >
                    OK
                  </button>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Property Modal */}
      <PropertyModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingProperty(null)
        }}
        property={editingProperty}
        onSave={handleSaveProperty}
      />

      {/* Import folder into property modal */}
      <Transition appear show={!!importFolderProperty} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setImportFolderProperty(null)}>
          <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/30" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-lg rounded-xl bg-white p-4 shadow-xl">
                  <div className="flex items-center justify-between mb-3">
                    <Dialog.Title as="h3" className="text-lg font-semibold text-graphite">
                      Import folder into: {importFolderProperty?.title}
                    </Dialog.Title>
                    <button type="button" onClick={() => setImportFolderProperty(null)} className="btn-close">
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="flex gap-2 flex-wrap mb-4">
                    <input
                      type="text"
                      value={importFolderPath}
                      onChange={(e) => setImportFolderPath(e.target.value)}
                      placeholder="Path or use Browse"
                      className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-champagne focus:border-champagne"
                      disabled={importFolderLoading}
                    />
                    <button type="button" onClick={openBrowseForImport} disabled={importFolderLoading} className="btn-outline btn-sm inline-flex items-center gap-2">
                      <FolderOpenIcon className="h-5 w-5" />
                      Browse
                    </button>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setImportFolderProperty(null)} className="btn-ghost btn-sm">Cancel</button>
                    <button type="button" onClick={handleImportFolderIntoProperty} disabled={importFolderLoading || !importFolderPath.trim()} className="btn-filled btn-sm">
                      {importFolderLoading ? 'Importing…' : 'Import'}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Browse folders modal (for import-into-property) */}
      <Transition appear show={browseOpen} as={Fragment}>
        <Dialog as="div" className="relative z-60" onClose={() => setBrowseOpen(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/30" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-lg rounded-xl bg-white p-4 shadow-xl">
                  <div className="flex items-center justify-between mb-3">
                    <Dialog.Title as="h3" className="text-lg font-semibold text-graphite">Choose folder</Dialog.Title>
                    <button type="button" onClick={() => setBrowseOpen(false)} className="btn-close"><XMarkIcon className="h-5 w-5" /></button>
                  </div>
                  {browseError && <p className="mb-3 text-sm text-red-600">{browseError}</p>}
                  <div className="mb-3 flex items-center gap-2">
                    {browseParentPath !== null && (
                      <button type="button" onClick={() => loadBrowse(browseParentPath)} className="btn-ghost btn-sm inline-flex items-center gap-1">
                        <ChevronUpIcon className="h-4 w-4" /> Up
                      </button>
                    )}
                    {browseCurrentPath && (
                      <button type="button" onClick={() => selectBrowseForImport(browseCurrentPath)} className="btn-filled btn-sm">Select this folder</button>
                    )}
                  </div>
                  <p className="mb-2 truncate text-xs text-gray-500" title={browseCurrentPath || 'Select a location'}>{browseCurrentPath || 'Select a location'}</p>
                  {browseLoading ? (
                    <p className="py-4 text-center text-sm text-gray-500">Loading…</p>
                  ) : (
                    <ul className="max-h-64 space-y-1 overflow-y-auto rounded-sm border border-gray-200 p-2">
                      {browseRoots.map((r) => (
                        <li key={r.path}>
                          <button type="button" onClick={() => loadBrowse(r.path)} className="btn-ghost btn-sm flex w-full items-center gap-2 text-left">
                            <FolderOpenIcon className="h-5 w-5 shrink-0 text-champagne" />{r.name}
                          </button>
                        </li>
                      ))}
                      {browseFolders.map((f) => (
                        <li key={f.path}>
                          <button type="button" onClick={() => loadBrowse(f.path)} className="btn-ghost btn-sm flex w-full items-center gap-2 text-left">
                            <FolderIcon className="h-5 w-5 shrink-0 text-gray-500" />{f.name}
                          </button>
                        </li>
                      ))}
                      {!browseLoading && browseRoots.length === 0 && browseFolders.length === 0 && !browseError && <li className="py-2 text-center text-sm text-gray-500">No folders here</li>}
                    </ul>
                  )}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  )
}
