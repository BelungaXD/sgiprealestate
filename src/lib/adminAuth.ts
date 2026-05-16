import type { NextApiRequest, NextApiResponse } from 'next'
import type { AdminRole } from '../../prisma/generated/client'
import { getAdminSessionFromRequest, type AdminSessionPayload } from '@/lib/adminSession'

export type { AdminRole }

export type AdminSession = AdminSessionPayload

export type AdminPermission =
  | 'manage_users'
  | 'manage_media'
  | 'view_inquiries'
  | 'manage_inquiries'
  | 'manage_properties'
  | 'manage_areas'
  | 'manage_developers'
  | 'system_settings'

const ROLE_PERMISSIONS: Record<AdminRole, ReadonlySet<AdminPermission>> = {
  SUPER_ADMIN: new Set([
    'manage_users',
    'manage_media',
    'view_inquiries',
    'manage_inquiries',
    'manage_properties',
    'manage_areas',
    'manage_developers',
    'system_settings',
  ]),
  MANAGER: new Set([
    'manage_media',
    'view_inquiries',
    'manage_inquiries',
    'manage_properties',
    'manage_areas',
    'manage_developers',
  ]),
  CONTENT_EDITOR: new Set(['manage_media', 'manage_properties', 'manage_areas']),
}

export function adminHasPermission(role: AdminRole, permission: AdminPermission): boolean {
  return ROLE_PERMISSIONS[role].has(permission)
}

export function getVisibleAdminTabs(role: AdminRole): string[] {
  const tabs: string[] = ['properties', 'areas']
  if (adminHasPermission(role, 'manage_developers')) {
    tabs.push('developers')
  }
  if (adminHasPermission(role, 'view_inquiries')) {
    tabs.push('inquiries')
  }
  if (adminHasPermission(role, 'manage_users') || adminHasPermission(role, 'manage_media')) {
    tabs.push('settings')
  }
  return tabs
}

export function getAdminSession(req: NextApiRequest): AdminSession | null {
  return getAdminSessionFromRequest(req)
}

export function requireAdminSession(
  req: NextApiRequest,
  res: NextApiResponse,
  options?: { permission?: AdminPermission; roles?: AdminRole[] }
): AdminSession | null {
  const session = getAdminSession(req)
  if (!session) {
    res.status(401).json({ ok: false, error: 'unauthorized' })
    return null
  }

  if (options?.roles && !options.roles.includes(session.role)) {
    res.status(403).json({ ok: false, error: 'forbidden' })
    return null
  }

  if (options?.permission && !adminHasPermission(session.role, options.permission)) {
    res.status(403).json({ ok: false, error: 'forbidden' })
    return null
  }

  return session
}

export function managerLeadScope(session: AdminSession): { assignedAdminId: string } | null {
  if (session.role !== 'MANAGER' || !session.adminId) {
    return null
  }
  return { assignedAdminId: session.adminId }
}

export function managerPropertyScope(session: AdminSession): { assignedAdminId: string } | null {
  if (session.role !== 'MANAGER' || !session.adminId) {
    return null
  }
  return { assignedAdminId: session.adminId }
}
