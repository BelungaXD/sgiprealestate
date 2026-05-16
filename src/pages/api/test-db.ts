import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).end()
  }

  let connectOk = false
  let connectError: string | null = null
  let connectCode: string | null = null
  try {
    await prisma.$connect()
    connectOk = true
  } catch (e: unknown) {
    const err = e as { message?: string; code?: string }
    connectError = err.message ?? String(e)
    connectCode = err.code ?? null
  }

  return res.status(connectOk ? 200 : 503).json({
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    databaseUrlPreview: process.env.DATABASE_URL ?
      process.env.DATABASE_URL.replace(/:[^:]*@/, ':***@') :
      'not set',
    nodeEnv: process.env.NODE_ENV,
    connectOk,
    connectError,
    connectCode,
  })
}
