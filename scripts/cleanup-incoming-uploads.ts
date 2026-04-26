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
import { createScopedLogger } from '../src/lib/logger'

const INCOMING = join(process.cwd(), 'public', 'uploads', 'incoming')
const MAX_AGE_MS = (Number(process.env.INCOMING_MAX_AGE_MINUTES) || 30) * 60 * 1000
const log = createScopedLogger('scripts/cleanup-incoming-uploads')

async function main(): Promise<void> {
  if (!existsSync(INCOMING)) {
    log.info('cleanup-incoming: skip', { incomingPath: INCOMING })
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
    log.info('cleanup-incoming: removed', { path: full, ageMinutes: Math.round(ageMs / 60000) })
  }

  log.info('cleanup-incoming: finished', { removedBatches: removed })
}

main().catch((err) => {
  log.errorWithException('cleanup-incoming: fatal', err)
  process.exit(1)
})
