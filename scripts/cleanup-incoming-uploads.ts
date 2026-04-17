/**
 * Deletes batch dirs under public/uploads/incoming/<uploadId>/ when the directory
 * mtime is older than INCOMING_MAX_AGE_MINUTES (default 30). Does not remove
 * the incoming root.
 *
 * Run: npm run cleanup:incoming
 * Cron example (every 15 min): 0,15,30,45 * * * * cd /path/to/app && npm run cleanup:incoming
 */

import { existsSync } from 'fs'
import { readdir, rm, stat } from 'fs/promises'
import { join } from 'path'

const INCOMING = join(process.cwd(), 'public', 'uploads', 'incoming')
const MAX_AGE_MS = (Number(process.env.INCOMING_MAX_AGE_MINUTES) || 30) * 60 * 1000

function ts(): string {
  return new Date().toISOString()
}

async function main(): Promise<void> {
  if (!existsSync(INCOMING)) {
    console.info(`[${ts()}] cleanup-incoming: skip (no ${INCOMING})`)
    return
  }

  const now = Date.now()
  const entries = await readdir(INCOMING, { withFileTypes: true })
  let removed = 0

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) continue
    const full = join(INCOMING, entry.name)
    const st = await stat(full)
    const ageMs = now - st.mtimeMs
    if (ageMs < MAX_AGE_MS) continue

    await rm(full, { recursive: true, force: true })
    removed++
    console.info(`[${ts()}] cleanup-incoming: removed ${full} (~${Math.round(ageMs / 60000)} min old)`)
  }

  console.info(`[${ts()}] cleanup-incoming: finished, removed ${removed} batch(es)`)
}

main().catch((err) => {
  console.error(`[${ts()}] cleanup-incoming: fatal`, err)
  process.exit(1)
})
