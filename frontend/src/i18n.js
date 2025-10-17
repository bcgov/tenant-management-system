import { nextTick } from 'vue'
import { createI18n } from 'vue-i18n'

export const SUPPORT_LOCALES = ['en']

export async function setupI18n(options = { locale: 'en' }) {
  options.legacy = false
  const i18n = createI18n(options)
  setI18nLanguage(i18n, options.locale)
  await loadSyncLocaleMessages(i18n, options.locale)
  return i18n
}

export function setI18nLanguage(i18n, locale) {
  i18n.global.locale.value = locale
  /**
   * NOTE:
   * If you need to specify the language setting for headers, such as the `fetch` API, set it here.
   * The following is an example for axios.
   *
   * axios.defaults.headers.common['Accept-Language'] = locale
   */
  document.querySelector('html').setAttribute('lang', locale)
}

export async function loadSyncLocaleMessages(i18n, locale) {
  // load locale messages with dynamic import
  const messages = await import(
    /* webpackChunkName: "locale-[request]" */ `./locales/${locale}.json`
  )

  // set locale and locale message
  i18n.global.setLocaleMessage(locale, messages.default)
}

export async function loadLocaleMessages(i18n, locale) {
  // load locale messages with dynamic import
  const messages = await import(
    /* webpackChunkName: "locale-[request]" */ `./locales/${locale}.json`
  )

  // set locale and locale message
  i18n.global.setLocaleMessage(locale, messages.default)

  return nextTick()
}

export const i18n = await setupI18n({ locale: 'en' })