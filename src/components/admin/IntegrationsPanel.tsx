import { useCallback, useEffect, useState, FormEvent } from 'react'
import { useTranslation } from 'next-i18next/pages'
import { EyeIcon, EyeSlashIcon, KeyIcon } from '@heroicons/react/24/outline'
import { INTEGRATION_CATEGORIES, type IntegrationCategory } from '@/lib/integrations/catalog'
import { getErrorMessage } from '@/lib/utils/errorMessage'

type IntegrationRow = {
  key: string
  envVar: string
  category: IntegrationCategory
  labelKey: string
  descriptionKey: string
  fieldType: 'secret' | 'url' | 'text'
  optional: boolean
  configured: boolean
  source: 'database' | 'env' | 'none'
  maskedValue: string
  updatedAt: string | null
}

export default function IntegrationsPanel() {
  const { t } = useTranslation('admin')
  const [rows, setRows] = useState<IntegrationRow[]>([])
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [showValue, setShowValue] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/integrations', { credentials: 'same-origin' })
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean
        integrations?: IntegrationRow[]
      }
      if (!res.ok || !data.ok) {
        throw new Error(t('integrations.loadError'))
      }
      setRows(data.integrations || [])
      setDrafts({})
    } catch (err: unknown) {
      setError(getErrorMessage(err, t('integrations.loadError')))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    load()
  }, [load])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const settings = Object.entries(drafts).map(([key, value]) => ({ key, value }))
    if (settings.length === 0) {
      setSuccess(t('integrations.noChanges'))
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const res = await fetch('/api/admin/integrations', {
        method: 'PUT',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean
        integrations?: IntegrationRow[]
      }
      if (!res.ok || !data.ok) {
        throw new Error(t('integrations.saveError'))
      }
      setRows(data.integrations || [])
      setDrafts({})
      setSuccess(t('integrations.saveSuccess'))
    } catch (err: unknown) {
      setError(getErrorMessage(err, t('integrations.saveError')))
    } finally {
      setSaving(false)
    }
  }

  const categoryTitle = (cat: IntegrationCategory) => t(`integrations.categories.${cat}`)

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center gap-2 mb-2">
        <KeyIcon className="h-5 w-5 text-champagne" />
        <h3 className="text-base font-semibold text-graphite">{t('integrations.title')}</h3>
      </div>

      {error && (
        <p className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </p>
      )}
      {success && (
        <p className="mb-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
          {success}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">{t('integrations.loading')}</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8">
          {INTEGRATION_CATEGORIES.map((category) => {
            const items = rows.filter((r) => r.category === category)
            if (items.length === 0) return null
            return (
              <section key={category}>
                <h4 className="text-sm font-semibold text-graphite mb-3 border-b border-gray-100 pb-2">
                  {categoryTitle(category)}
                </h4>
                <div className="space-y-4">
                  {items.map((item) => {
                    const inputType =
                      item.fieldType === 'secret'
                        ? showValue[item.key]
                          ? 'text'
                          : 'password'
                        : item.fieldType === 'url'
                          ? 'url'
                          : 'text'
                    return (
                      <div key={item.key}>
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                          <label className="text-sm font-medium text-graphite">
                            {t(item.labelKey)}
                            {!item.optional && (
                              <span className="text-red-500 ml-0.5">*</span>
                            )}
                          </label>
                          {item.configured && (
                            <span className="text-xs text-gray-500">
                              {item.source === 'env'
                                ? t('integrations.configuredInEnv', { var: item.envVar })
                                : t('integrations.configured', {
                                    masked: item.maskedValue,
                                  })}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <input
                            type={inputType}
                            value={drafts[item.key] ?? ''}
                            onChange={(e) =>
                              setDrafts((prev) => ({ ...prev, [item.key]: e.target.value }))
                            }
                            placeholder={
                              item.configured
                                ? t('integrations.placeholderKeep', {
                                    masked: item.maskedValue,
                                  })
                                : t('integrations.placeholderEmpty')
                            }
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-champagne focus:border-champagne"
                            autoComplete="off"
                          />
                          {item.fieldType === 'secret' && (
                            <button
                              type="button"
                              onClick={() =>
                                setShowValue((prev) => ({
                                  ...prev,
                                  [item.key]: !prev[item.key],
                                }))
                              }
                              className="px-3 py-2 border border-gray-300 rounded-md text-gray-500 hover:text-gray-800"
                              aria-label={
                                showValue[item.key]
                                  ? t('integrations.hideValue')
                                  : t('integrations.showValue')
                              }
                            >
                              {showValue[item.key] ? (
                                <EyeSlashIcon className="h-5 w-5" />
                              ) : (
                                <EyeIcon className="h-5 w-5" />
                              )}
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-1 font-mono">{item.envVar}</p>
                      </div>
                    )
                  })}
                </div>
              </section>
            )
          })}
          <div className="flex items-center gap-3 pt-2">
            <button type="submit" disabled={saving} className="btn-filled btn-sm">
              {saving ? t('integrations.saving') : t('integrations.save')}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
