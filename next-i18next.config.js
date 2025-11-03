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
}
