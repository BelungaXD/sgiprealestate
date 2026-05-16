import crypto from 'crypto'

function encryptionKey(): Buffer {
  const secret =
    process.env.ADMIN_SESSION_SECRET?.trim() ||
    process.env.ADMIN_PASSWORD?.trim() ||
    'dev-sgip-integration-secrets-not-for-production'
  return crypto.createHash('sha256').update(`sgip-integration-v1:${secret}`, 'utf8').digest()
}

export function encryptIntegrationValue(plain: string): string {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(), iv)
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return [
    'v1',
    iv.toString('base64url'),
    tag.toString('base64url'),
    encrypted.toString('base64url'),
  ].join(':')
}

export function decryptIntegrationValue(payload: string): string | null {
  const parts = payload.split(':')
  if (parts.length !== 4 || parts[0] !== 'v1') return null
  try {
    const iv = Buffer.from(parts[1], 'base64url')
    const tag = Buffer.from(parts[2], 'base64url')
    const data = Buffer.from(parts[3], 'base64url')
    const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey(), iv)
    decipher.setAuthTag(tag)
    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8')
  } catch {
    return null
  }
}

export function maskSecret(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (trimmed.length <= 4) return '••••'
  return `••••${trimmed.slice(-4)}`
}
