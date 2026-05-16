import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'next-i18next/pages'
import { UserGroupIcon, FolderOpenIcon, KeyIcon } from '@heroicons/react/24/outline'
import MediaDrivePanel from './MediaDrivePanel'
import IntegrationsPanel from './IntegrationsPanel'

type SettingsSubTab = 'team' | 'media' | 'integrations'

interface SettingsPanelProps {
  showTeam: boolean
  showMedia: boolean
  showIntegrations: boolean
  teamSection: ReactNode
}

export default function SettingsPanel({
  showTeam,
  showMedia,
  showIntegrations,
  teamSection,
}: SettingsPanelProps) {
  const { t } = useTranslation('admin')

  const tabs = useMemo(() => {
    const list: { id: SettingsSubTab; label: string; icon: typeof UserGroupIcon }[] = []
    if (showTeam) {
      list.push({ id: 'team', label: t('settings.tabs.team'), icon: UserGroupIcon })
    }
    if (showMedia) {
      list.push({ id: 'media', label: t('settings.tabs.media'), icon: FolderOpenIcon })
    }
    if (showIntegrations) {
      list.push({ id: 'integrations', label: t('settings.tabs.integrations'), icon: KeyIcon })
    }
    return list
  }, [showTeam, showMedia, showIntegrations, t])

  const [subTab, setSubTab] = useState<SettingsSubTab>(() => {
    if (showMedia && !showTeam) return 'media'
    if (showIntegrations && !showTeam && !showMedia) return 'integrations'
    return 'team'
  })

  useEffect(() => {
    if (tabs.length === 0) return
    if (!tabs.some((tab) => tab.id === subTab)) {
      setSubTab(tabs[0].id)
    }
  }, [tabs, subTab])

  if (tabs.length === 0) return null

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-graphite mb-2">{t('settings.title')}</h2>
        <nav className="mt-4 flex flex-wrap gap-2 border-b border-gray-200 pb-0" aria-label={t('settings.tabs.label')}>
          {tabs.map((tab) => {
            const Icon = tab.icon
            const active = subTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSubTab(tab.id)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  active
                    ? 'border-champagne text-champagne'
                    : 'border-transparent text-gray-600 hover:text-graphite hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {subTab === 'team' && showTeam && teamSection}
      {subTab === 'media' && showMedia && <MediaDrivePanel />}
      {subTab === 'integrations' && showIntegrations && <IntegrationsPanel />}
    </div>
  )
}
