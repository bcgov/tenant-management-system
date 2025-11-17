import { nextTick } from 'vue'
import { createI18n, type I18n, type I18nOptions } from 'vue-i18n'

export const SUPPORT_LOCALES = ['en']
const DEFAULT_OPTS = {
  locale: 'en',
  messages: {},
}

if (process.env.NODE_ENV === 'test') {
  const messages = await import('./locales/en.json')
  DEFAULT_OPTS.messages = { en: messages.default }
}

export function setupI18n(opts: I18nOptions): I18n {
  opts = { ...DEFAULT_OPTS, ...opts }
  opts.legacy = false
  const i18n = createI18n(opts)
  setI18nLanguage(i18n, opts.locale as string)
  loadSyncLocaleMessages(i18n, opts.locale as string)
  return i18n
}

export function setI18nLanguage(i18n: I18n, locale: string) {
  i18n.global.locale = locale
  /**
   * NOTE:
   * If you need to specify the language setting for headers, such as the `fetch` API, set it here.
   * The following is an example for axios.
   *
   * axios.defaults.headers.common['Accept-Language'] = locale
   */
  try {
    document?.querySelector('html')?.setAttribute('lang', locale)
    // eslint-disable-next-line
  } catch (e) {
    // do nothing as likely test env
  }
}

export async function loadSyncLocaleMessages(i18n: I18n, locale: string) {
  // load locale messages with dynamic import
  const messages = await import(
    /* webpackChunkName: "locale-[request]" */ `./locales/${locale}.json`
  )

  // set locale and locale message
  i18n.global.setLocaleMessage(locale, messages.default)
}

export async function loadLocaleMessages(i18n: I18n, locale: string) {
  // load locale messages with dynamic import
  const messages = await import(
    /* webpackChunkName: "locale-[request]" */ `./locales/${locale}.json`
  )

  // set locale and locale message
  i18n.global.setLocaleMessage(locale, messages.default)

  return nextTick()
}

export const i18n: I18n = setupI18n({ locale: 'en' })
