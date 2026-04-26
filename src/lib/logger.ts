import { appendFile, mkdir } from 'fs/promises'
import { join } from 'path'

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'

type LogMeta = Record<string, unknown> | undefined

const LOGS_DIR = join(process.cwd(), 'logs')
const APP_LOG_PATH = join(LOGS_DIR, 'app.log')
const ERROR_LOG_PATH = join(LOGS_DIR, 'error.log')

let logsDirReady = false
let logsDirInitPromise: Promise<void> | null = null

function safeStringify(meta?: LogMeta): string {
  if (!meta) return ''
  try {
    return JSON.stringify(meta)
  } catch {
    return JSON.stringify({ metaStringifyError: true })
  }
}

function formatError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    }
  }
  return { error }
}

async function ensureLogsDir(): Promise<void> {
  if (logsDirReady) return
  if (!logsDirInitPromise) {
    logsDirInitPromise = mkdir(LOGS_DIR, { recursive: true })
      .then(() => {
        logsDirReady = true
      })
      .catch((err) => {
        logsDirInitPromise = null
        throw err
      })
  }
  await logsDirInitPromise
}

function buildLine(level: LogLevel, scope: string, message: string, meta?: LogMeta): string {
  const ts = new Date().toISOString()
  const metaPart = safeStringify(meta)
  return metaPart
    ? `[${ts}] [${level}] [${scope}] ${message} ${metaPart}\n`
    : `[${ts}] [${level}] [${scope}] ${message}\n`
}

async function writeLine(path: string, line: string): Promise<void> {
  await ensureLogsDir()
  await appendFile(path, line, 'utf8')
}

async function writeLog(level: LogLevel, scope: string, message: string, meta?: LogMeta): Promise<void> {
  const line = buildLine(level, scope, message, meta)
  try {
    await writeLine(APP_LOG_PATH, line)
    if (level === 'ERROR') {
      await writeLine(ERROR_LOG_PATH, line)
    }
  } catch (fileError) {
    const fallback = `[${new Date().toISOString()}] [LOGGER_FALLBACK] [${scope}] ${message} ${safeStringify({
      fileError: formatError(fileError),
      meta,
    })}`
    if (level === 'ERROR') {
      console.error(fallback)
    } else if (level === 'WARN') {
      console.warn(fallback)
    } else {
      console.info(fallback)
    }
  }
}

function createScopedLogger(scope: string) {
  return {
    debug: (message: string, meta?: LogMeta) => void writeLog('DEBUG', scope, message, meta),
    info: (message: string, meta?: LogMeta) => void writeLog('INFO', scope, message, meta),
    warn: (message: string, meta?: LogMeta) => void writeLog('WARN', scope, message, meta),
    error: (message: string, meta?: LogMeta) => void writeLog('ERROR', scope, message, meta),
    errorWithException: (message: string, error: unknown, meta?: LogMeta) =>
      void writeLog('ERROR', scope, message, {
        ...meta,
        ...formatError(error),
      }),
  }
}

export const logger = createScopedLogger('app')
export { createScopedLogger, APP_LOG_PATH, ERROR_LOG_PATH, LOGS_DIR }

