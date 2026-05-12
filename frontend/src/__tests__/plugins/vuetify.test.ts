import { describe, expect, it } from 'vitest'

import vuetify from '@/plugins/vuetify'

// These tests are intentionally minimal. The vuetify plugin is pure
// configuration with no logic to unit test. They exist solely to maintain
// coverage and signal that the omission is deliberate.
describe('vuetify', () => {
  it('is defined', () => {
    expect(vuetify).toBeDefined()
  })

  it('uses the bcgovLight theme by default', () => {
    expect(vuetify.theme.global.name.value).toBe('bcgovLight')
  })

  it('uses the mdi icon set', () => {
    expect(vuetify.icons.defaultSet).toBe('mdi')
  })
})
