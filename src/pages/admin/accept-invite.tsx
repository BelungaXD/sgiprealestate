import { useEffect, useState, FormEvent } from 'react'
import { GetServerSideProps } from 'next'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next/pages'
import { serverSideTranslations } from 'next-i18next/pages/serverSideTranslations'
import Head from 'next/head'
import Image from 'next/image'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
function generateStrongPasswordClient(length = 16): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lower = 'abcdefghijkmnopqrstuvwxyz'
  const digits = '23456789'
  const symbols = '!@#$%&*-_+='
  const all = upper + lower + digits + symbols
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => all[b % all.length]).join('')
}

export default function AcceptAdminInvite() {
  const { t } = useTranslation('admin')
  const router = useRouter()
  const token = typeof router.query.token === 'string' ? router.query.token : ''

  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!router.isReady || !token) {
      if (router.isReady && !token) setLoading(false)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(
          `/api/admin/invite/validate?token=${encodeURIComponent(token)}`
        )
        const data = await res.json().catch(() => ({}))
        if (!cancelled) {
          if (res.ok && data.ok) {
            setEmail(data.email || '')
          } else {
            setError(t('invite.invalidToken'))
          }
        }
      } catch {
        if (!cancelled) setError(t('invite.serverError'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [router.isReady, token, t])

  const handleGenerate = () => {
    const generated = generateStrongPasswordClient()
    setPassword(generated)
    setConfirm(generated)
    setShowPassword(true)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== confirm) {
      setError(t('invite.passwordMismatch'))
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/invite/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.ok) {
        setError(t('invite.acceptFailed'))
        return
      }
      setDone(true)
    } catch {
      setError(t('invite.serverError'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Head>
        <title>{`${t('invite.title')} | SGIP Real Estate`}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div className="admin-shell min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
          <div className="flex justify-center mb-6">
            <Image src="/images/sgip_logo.png" alt="SGIP" width={64} height={64} className="h-14 w-14 object-contain" />
          </div>
          <h1 className="text-xl font-bold text-graphite text-center mb-2">{t('invite.title')}</h1>
          {email && (
            <p className="text-sm text-gray-600 text-center mb-6">{email}</p>
          )}

          {loading ? (
            <p className="text-center text-gray-500 text-sm">{t('invite.loading')}</p>
          ) : done ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-green-700">{t('invite.success')}</p>
              <a href="/admin" className="btn-filled inline-block">
                {t('invite.goToLogin')}
              </a>
            </div>
          ) : error && !email ? (
            <p className="text-center text-red-600 text-sm">{error}</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <p className="text-sm text-red-600 rounded-md bg-red-50 px-3 py-2">{error}</p>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  {t('invite.passwordLabel')}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md text-sm focus:ring-champagne focus:border-champagne"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label={showPassword ? t('invite.hidePassword') : t('invite.showPassword')}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  {t('invite.confirmPasswordLabel')}
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-champagne focus:border-champagne"
                  autoComplete="new-password"
                />
              </div>
              <button
                type="button"
                onClick={handleGenerate}
                className="w-full btn-outline btn-sm text-sm"
              >
                {t('invite.generatePassword')}
              </button>
              <button type="submit" disabled={saving} className="w-full btn-filled">
                {saving ? t('invite.saving') : t('invite.submit')}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? 'en', ['admin', 'common'])),
    },
  }
}
