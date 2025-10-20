import { nextTick } from 'vue'
import { createI18n, type I18n, type I18nOptions } from 'vue-i18n'
import { default as messagesEn } from './locales/en.json'

export const SUPPORT_LOCALES = ['en']
const DEFAULT_OPTS = {
  locale: 'en',
  messages: {
    en: messagesEn,
  }
}

export function setupI18n(opts: I18nOptions): I18n {
  opts = { ...DEFAULT_OPTS, ...opts }
  opts.legacy = false
  const i18n = createI18n(opts)
  setI18nLanguage(i18n, opts.locale as string)
  loadSyncLocaleMessages(i18n, opts.locale as string)
  return i18n
}

export function setI18nLanguage(i18n: any, locale: string) {
  i18n.global.locale.value = locale
  /**
   * NOTE:
   * If you need to specify the language setting for headers, such as the `fetch` API, set it here.
   * The following is an example for axios.
   *
   * axios.defaults.headers.common['Accept-Language'] = locale
   */
  try{
    document?.querySelector('html')?.setAttribute('lang', locale)
  }catch(err){
    //pass probably a test environment
  }
}

export async function loadSyncLocaleMessages(i18n: any, locale: string) {
  // load locale messages with dynamic import
  let messages = await import(
    /* webpackChunkName: "locale-[request]" */ `./locales/${locale}.json`
  )

  // set locale and locale message
  i18n.global.setLocaleMessage(locale, messages.default)
}

export async function loadLocaleMessages(i18n: any, locale: string) {
  // load locale messages with dynamic import
  let messages = await import(
    /* webpackChunkName: "locale-[request]" */ `./locales/${locale}.json`
  )

  // set locale and locale message
  i18n.global.setLocaleMessage(locale, messages.default)

  return nextTick()
}

export const i18n: I18n = setupI18n({ locale: 'en' })
