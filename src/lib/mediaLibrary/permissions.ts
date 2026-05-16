import type { AdminRole } from '../../prisma/generated/client'

export type MediaFolderAccess = {
  viewRoles: AdminRole[]
  editRoles: AdminRole[]
}

export function canViewMediaFolder(role: AdminRole, folder: MediaFolderAccess): boolean {
  if (role === 'SUPER_ADMIN') return true
  if (folder.editRoles.includes(role)) return true
  return folder.viewRoles.includes(role)
}

export function canEditMediaFolder(role: AdminRole, folder: MediaFolderAccess): boolean {
  if (role === 'SUPER_ADMIN') return true
  return folder.editRoles.includes(role)
}

export function canManageMediaFolderSettings(role: AdminRole): boolean {
  return role === 'SUPER_ADMIN'
}
