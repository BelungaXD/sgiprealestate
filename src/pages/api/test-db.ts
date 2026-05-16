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
    // #region agent log
    fetch('http://127.0.0.1:7934/ingest/9cd6050e-5c73-4f29-afde-23295d7c65a1',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'b58f84'},body:JSON.stringify({sessionId:'b58f84',hypothesisId:'H1',location:'api/test-db.ts',message:'test-db connect failed',data:{code:connectCode,message:connectError,dbHost:process.env.DB_HOST||null,dbPort:process.env.DB_PORT||null},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
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
