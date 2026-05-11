import propertyEn from '../../public/locales/en/property.json'
import propertyRu from '../../public/locales/ru/property.json'
import propertyAr from '../../public/locales/ar/property.json'

/** Full `property` namespace JSON — used to repair i18n when the store has a partial `property` bundle. */
export const PROPERTY_I18N_BUNDLES = {
  en: propertyEn,
  ru: propertyRu,
  ar: propertyAr,
} as const

export type PropertyLocaleKey = keyof typeof PROPERTY_I18N_BUNDLES
