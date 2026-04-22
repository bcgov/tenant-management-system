import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createVuetify } from 'vuetify'

import LoadingWrapper from '@/components/ui/LoadingWrapper.vue'

const vuetify = createVuetify()

const mountComponent = (props: {
  delayMilliseconds?: number
  loading: boolean
  loadingMessage?: string
}) =>
  mount(LoadingWrapper, {
    props,
    slots: {
      default: '<div class="slotted">Content</div>',
    },
    global: {
      plugins: [vuetify],
    },
  })

describe('LoadingWrapper.vue', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('when not loading shows content', () => {
    const wrapper = mountComponent({ loading: false })

    expect(wrapper.find('[data-test-id="content"]').exists()).toBe(true)
    expect(wrapper.find('[data-test-id="message"]').exists()).toBe(false)
    expect(wrapper.find('[data-test-id="spinner"]').exists()).toBe(false)
  })

  it('when loading shows spinner after no delay', async () => {
    const wrapper = mountComponent({ delayMilliseconds: 0, loading: true })

    vi.runAllTimers()
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-test-id="content"]').exists()).toBe(false)
    expect(wrapper.find('[data-test-id="message"]').exists()).toBe(false)
    expect(wrapper.find('[data-test-id="spinner"]').exists()).toBe(true)
  })

  it('when loading shows no spinner before delay', async () => {
    const wrapper = mountComponent({ delayMilliseconds: 300, loading: true })

    vi.advanceTimersByTime(100)
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-test-id="content"]').exists()).toBe(false)
    expect(wrapper.find('[data-test-id="message"]').exists()).toBe(false)
    expect(wrapper.find('[data-test-id="spinner"]').exists()).toBe(false)
  })

  it('when loading shows spinner after delay', async () => {
    const wrapper = mountComponent({ delayMilliseconds: 300, loading: true })

    vi.advanceTimersByTime(300)
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-test-id="content"]').exists()).toBe(false)
    expect(wrapper.find('[data-test-id="message"]').exists()).toBe(false)
    expect(wrapper.find('[data-test-id="spinner"]').exists()).toBe(true)
  })

  it('when loading shows spinner and message after delay', async () => {
    const wrapper = mountComponent({
      delayMilliseconds: 300,
      loading: true,
      loadingMessage: 'Loading...',
    })

    vi.advanceTimersByTime(300)
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-test-id="content"]').exists()).toBe(false)
    expect(wrapper.find('[data-test-id="message"]').text()).toBe('Loading...')
    expect(wrapper.find('[data-test-id="spinner"]').exists()).toBe(true)
  })

  it('unmounts cleanly when there is no active timeout', () => {
    const wrapper = mountComponent({ loading: false })

    expect(() => wrapper.unmount()).not.toThrow()
  })

  it('unmounts cleanly when there is an active timeout', async () => {
    const wrapper = mountComponent({ delayMilliseconds: 100, loading: true })

    vi.advanceTimersByTime(300)
    await wrapper.vm.$nextTick()

    expect(() => wrapper.unmount()).not.toThrow()
  })

  it('clears the timeout after loading', async () => {
    const wrapper = mountComponent({ delayMilliseconds: 100, loading: true })
    vi.advanceTimersByTime(300)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-test-id="content"]').exists()).toBe(false)
    expect(wrapper.find('[data-test-id="spinner"]').exists()).toBe(true)

    await wrapper.setProps({ loading: false })
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-test-id="content"]').exists()).toBe(true)
    expect(wrapper.find('[data-test-id="spinner"]').exists()).toBe(false)
  })

  it('clears the spinner on unmount', async () => {
    const wrapper = mountComponent({ delayMilliseconds: 300, loading: true })

    wrapper.unmount()
    vi.advanceTimersByTime(300)
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-test-id="spinner"]').exists()).toBe(false)
  })
})
