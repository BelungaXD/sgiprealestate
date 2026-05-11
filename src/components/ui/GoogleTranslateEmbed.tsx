import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next/pages'
import { useEffect, useId, useState } from 'react'

const CONTAINER_ID = 'google_translate_element'
const SCRIPT_ID = 'google-translate-script'

type TranslateElementCtor = new (
  options: {
    pageLanguage: string
    includedLanguages: string
    layout: number
    autoDisplay: boolean
  },
  container: string
) => unknown

type GTranslate = {
  translate: {
    TranslateElement: TranslateElementCtor & {
      InlineLayout: { SIMPLE: number }
    }
  }
}

function getGoogle(): GTranslate | undefined {
  return (typeof window !== 'undefined' ? (window as unknown as { google?: GTranslate }).google : undefined) as
    | GTranslate
    | undefined
}

/**
 * Google Website Translator — loads only after user click so it does not block the main thread on every page.
 */
export default function GoogleTranslateEmbed() {
  const router = useRouter()
  const { t } = useTranslation('common')
  const labelId = useId()
  const pageLanguage = (router.locale || 'en').split('-')[0]
  const [widgetOpen, setWidgetOpen] = useState(false)

  useEffect(() => {
    if (!widgetOpen) return

    const mount = () => {
      const el = document.getElementById(CONTAINER_ID)
      const google = getGoogle()
      if (!el || !google?.translate?.TranslateElement) return
      el.innerHTML = ''
      const InlineLayout = google.translate.TranslateElement.InlineLayout
      new google.translate.TranslateElement(
        {
          pageLanguage,
          includedLanguages: 'en,ru,ar,de,fr,es,it,pt,zh-CN,hi,ur',
          layout: InlineLayout.SIMPLE,
          autoDisplay: false,
        },
        CONTAINER_ID
      )
    }

    ;(window as unknown as { googleTranslateElementInit?: () => void }).googleTranslateElementInit = mount

    if (!document.getElementById(SCRIPT_ID)) {
      const script = document.createElement('script')
      script.id = SCRIPT_ID
      script.async = true
      script.src =
        'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'
      document.body.appendChild(script)
    } else if (getGoogle()?.translate?.TranslateElement) {
      mount()
    }
  }, [widgetOpen, pageLanguage])

  if (!widgetOpen) {
    return (
      <button
        type="button"
        className="shrink-0 whitespace-nowrap rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-600 hover:border-champagne hover:text-champagne"
        onClick={() => setWidgetOpen(true)}
      >
        {t('nav.googleTranslateButton')}
      </button>
    )
  }

  return (
    <div className="flex flex-col items-end gap-0.5 shrink-0" dir="ltr">
      <span id={labelId} className="sr-only">
        {t('nav.googleTranslateLabel')}
      </span>
      <div
        aria-labelledby={labelId}
        className="google-translate-slot max-w-[min(12rem,calc(100vw-8rem))] text-xs text-gray-600"
      >
        <div id={CONTAINER_ID} />
      </div>
    </div>
  )
}
