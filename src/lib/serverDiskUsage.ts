import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { hostname } from 'node:os'
import { join } from 'node:path'
import { formatBytes } from '@/lib/mediaLibrary/storage'
import { mediaLibraryRoot } from '@/lib/mediaLibrary/paths'

export type ServerDiskUsage = {
  path: string
  host: string
  totalBytes: number
  usedBytes: number
  availableBytes: number
  usagePercent: number
  totalLabel: string
  usedLabel: string
  availableLabel: string
}

/** Path passed to `df` — must exist; avoid bare macOS `/` (APFS system volume ~7%). */
export function serverDiskCheckPath(): string {
  const fromEnv = process.env.SERVER_DISK_CHECK_PATH?.trim()
  if (fromEnv) return fromEnv

  const candidates = [
    mediaLibraryRoot(),
    join(process.cwd(), 'public', 'uploads'),
    process.cwd(),
  ]
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate
  }
  return process.cwd()
}

export function readServerDiskUsage(path: string = serverDiskCheckPath()): ServerDiskUsage {
  const output = execFileSync('df', ['-Pk', path], { encoding: 'utf8' })
  // #region agent log
  fetch('http://127.0.0.1:7934/ingest/9cd6050e-5c73-4f29-afde-23295d7c65a1',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'98da29'},body:JSON.stringify({sessionId:'98da29',runId:'post-fix',hypothesisId:'H2-H4',location:'serverDiskUsage.ts:readServerDiskUsage:df',message:'df raw output',data:{path,envPath:process.env.SERVER_DISK_CHECK_PATH??null,platform:process.platform,dfLine:output.trim().split('\n')[1]??null},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  const lines = output.trim().split('\n')
  if (lines.length < 2) {
    throw new Error('Unexpected df output: no data row')
  }

  const cols = lines[1].trim().split(/\s+/)
  if (cols.length < 5) {
    throw new Error('Unexpected df output: insufficient columns')
  }

  const totalK = Number.parseInt(cols[1], 10)
  const usedK = Number.parseInt(cols[2], 10)
  const availK = Number.parseInt(cols[3], 10)
  const capacity = cols[4]
  const usagePercent = Number.parseFloat(capacity.replace('%', ''))

  if (![totalK, usedK, availK].every(Number.isFinite) || !Number.isFinite(usagePercent)) {
    throw new Error('Unexpected df numeric values')
  }

  const totalBytes = totalK * 1024
  const usedBytes = usedK * 1024
  const availableBytes = availK * 1024

  const result = {
    path,
    host: hostname(),
    totalBytes,
    usedBytes,
    availableBytes,
    usagePercent: Math.max(0, Math.min(100, usagePercent)),
    totalLabel: formatBytes(totalBytes),
    usedLabel: formatBytes(usedBytes),
    availableLabel: formatBytes(availableBytes),
  }
  // #region agent log
  fetch('http://127.0.0.1:7934/ingest/9cd6050e-5c73-4f29-afde-23295d7c65a1',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'98da29'},body:JSON.stringify({sessionId:'98da29',runId:'post-fix',hypothesisId:'H2-H4',location:'serverDiskUsage.ts:readServerDiskUsage:parsed',message:'parsed disk usage',data:{path,host:result.host,usagePercent:result.usagePercent,totalK,usedK,availK,capacity},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  return result
}
