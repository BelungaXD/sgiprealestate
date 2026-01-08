import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  return res.status(200).json({
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    databaseUrlPreview: process.env.DATABASE_URL ? 
      process.env.DATABASE_URL.replace(/:[^:]*@/, ':***@') : 
      'not set',
    nodeEnv: process.env.NODE_ENV,
  })
}
