import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import {
  ADMIN_SESSION_COOKIE,
  hashAdminPassword,
  readCookie,
  verifyAdminSessionToken,
} from '@/lib/adminSession'

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().trim().min(1).max(120).optional(),
  password: z.string().min(8).max(128),
})

function isAuthorized(req: NextApiRequest): boolean {
  const token = readCookie(req, ADMIN_SESSION_COOKIE)
  return verifyAdminSessionToken(token)
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isAuthorized(req)) {
    return res.status(401).json({ ok: false, error: 'unauthorized' })
  }

  if (req.method === 'GET') {
    try {
      const users = await prisma.admin.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'asc' },
      })

      return res.status(200).json({ ok: true, users })
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Failed to load admin users:`, error)
      return res.status(500).json({ ok: false, error: 'failed_to_load_users' })
    }
  }

  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
      const parsed = createUserSchema.parse(body)
      const email = parsed.email.trim().toLowerCase()
      const name = parsed.name?.trim() || null
      const password = hashAdminPassword(parsed.password)

      const user = await prisma.admin.create({
        data: { email, name, password },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          updatedAt: true,
        },
      })

      return res.status(201).json({ ok: true, user })
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ ok: false, error: 'invalid_payload', issues: error.errors })
      }
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
        return res.status(409).json({ ok: false, error: 'email_already_exists' })
      }
      console.error(`[${new Date().toISOString()}] Failed to create admin user:`, error)
      return res.status(500).json({ ok: false, error: 'failed_to_create_user' })
    }
  }

  return res.status(405).json({ ok: false, error: 'method_not_allowed' })
}
