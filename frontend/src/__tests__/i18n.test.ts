import { beforeEach, describe, expect, it } from 'vitest'
import { createI18n, type I18n } from 'vue-i18n'

import { setI18nLanguage, SUPPORT_LOCALES } from '@/i18n'

describe('SUPPORT_LOCALES', () => {
  it('contains english', () => {
    expect(SUPPORT_LOCALES).toContain('en')
  })

  it('is an array', () => {
    expect(Array.isArray(SUPPORT_LOCALES)).toBe(true)
  })
})

describe('setI18nLanguage', () => {
  let testI18n: I18n

  beforeEach(() => {
    testI18n = createI18n({ locale: 'en', messages: {} })
  })

  it('has the html lang attribute set to english', async () => {
    await import('@/i18n')

    expect(document.querySelector('html')?.getAttribute('lang')).toBe('en')
  })

  it('sets the locale on the i18n instance', () => {
    setI18nLanguage(testI18n, 'fr')

    expect(testI18n.global.locale).toBe('fr')
  })

  it('sets the lang attribute on the html element', () => {
    setI18nLanguage(testI18n, 'fr')

    expect(document.querySelector('html')?.getAttribute('lang')).toBe('fr')
  })

  it('does not throw when document is undefined', () => {
    const original = globalThis.document
    // @ts-expect-error intentionally removing document
    globalThis.document = undefined

    expect(() => setI18nLanguage(testI18n, 'en')).not.toThrow()

    globalThis.document = original
  })
})

describe('i18n', () => {
  it('is initialised with english locale', async () => {
    const { i18n } = await import('@/i18n')

    expect(i18n.global.locale).toBe('en')
  })

  it('has english locale messages loaded', async () => {
    const { i18n } = await import('@/i18n')

    const messages = i18n.global.getLocaleMessage('en')

    expect(messages).toBeTruthy()
    expect(Object.keys(messages).length).toBeGreaterThan(0)
  })
})
