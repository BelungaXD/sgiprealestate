import type { AdminRole } from '../../prisma/generated/client'
import { prisma } from '@/lib/prisma'

type SeedFolder = {
  slug: string
  name: string
  sortOrder: number
  viewRoles: AdminRole[]
  editRoles: AdminRole[]
}

export const SYSTEM_MEDIA_FOLDERS: SeedFolder[] = [
  {
    slug: 'property-brochures',
    name: 'Property brochures',
    sortOrder: 10,
    viewRoles: ['SUPER_ADMIN', 'MANAGER', 'CONTENT_EDITOR'],
    editRoles: ['SUPER_ADMIN', 'CONTENT_EDITOR'],
  },
  {
    slug: 'presentations',
    name: 'General presentations',
    sortOrder: 20,
    viewRoles: ['SUPER_ADMIN', 'MANAGER', 'CONTENT_EDITOR'],
    editRoles: ['SUPER_ADMIN', 'CONTENT_EDITOR'],
  },
  {
    slug: 'legal-documents',
    name: 'Legal documents',
    sortOrder: 30,
    viewRoles: ['SUPER_ADMIN', 'MANAGER', 'CONTENT_EDITOR'],
    editRoles: ['SUPER_ADMIN'],
  },
  {
    slug: 'training',
    name: 'Training materials',
    sortOrder: 40,
    viewRoles: ['SUPER_ADMIN', 'MANAGER', 'CONTENT_EDITOR'],
    editRoles: ['SUPER_ADMIN', 'CONTENT_EDITOR'],
  },
]

export async function ensureSystemMediaFolders(): Promise<void> {
  for (const seed of SYSTEM_MEDIA_FOLDERS) {
    await prisma.mediaFolder.upsert({
      where: { slug: seed.slug },
      create: {
        slug: seed.slug,
        name: seed.name,
        isSystem: true,
        sortOrder: seed.sortOrder,
        viewRoles: seed.viewRoles,
        editRoles: seed.editRoles,
      },
      update: {
        name: seed.name,
        sortOrder: seed.sortOrder,
      },
    })
  }
}
