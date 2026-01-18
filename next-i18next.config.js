module.exports = {
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'ru', 'ar'],
    localeDetection: true,
  },
  fallbackLng: {
    default: ['en'],
  },
  debug: process.env.NODE_ENV === 'development',
  reloadOnPrerender: process.env.NODE_ENV === 'development',
  // Use fallback namespace to prevent 404 errors
  fallbackNS: 'common',
  // Only load namespaces that are explicitly requested via serverSideTranslations
  // This prevents 404 errors for namespaces that aren't used
  load: 'languageOnly',
}
