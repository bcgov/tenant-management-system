import { createI18n, type I18n } from 'vue-i18n'

// Right now we only support English, but this is set up to allow for additional
// languages in the future. The code here and (probably) in the router will need
// to be expanded to allow users to select their preferred language either in
// the app or in the browser settings.
export const SUPPORT_LOCALES = ['en']

export function setI18nLanguage(i18n: I18n, locale: string) {
  i18n.global.locale = locale
  if (typeof document !== 'undefined') {
    document.querySelector('html')?.setAttribute('lang', locale)
  }
}

const i18n = createI18n({
  locale: 'en',
  messages: {},
})

// Load default locale.
const messages = await import('./locales/en.json')
i18n.global.setLocaleMessage('en', messages.default)
setI18nLanguage(i18n, 'en')

export { i18n }
