import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import LoadingWrapper from '@/components/ui/LoadingWrapper.vue'

const mountComponent = (props: {
  loading: boolean
  delay?: number
  loadingMessage?: string
}) =>
  mount(LoadingWrapper, {
    props,
    slots: {
      default: '<div class="slotted">Content</div>',
    },
    global: {
      stubs: {
        'v-container': { template: '<div><slot /></div>' },
        'v-row': { template: '<div><slot /></div>' },
        'v-col': { template: '<div><slot /></div>' },
        'v-progress-circular': { template: '<div class="spinner" />' },
      },
    },
  })

describe('LoadingWrapper.vue', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('when not loading', () => {
    it('renders slot content', () => {
      const wrapper = mountComponent({ loading: false })

      expect(wrapper.find('.slotted').exists()).toBe(true)
    })

    it('does not render the spinner', () => {
      const wrapper = mountComponent({ loading: false })

      expect(wrapper.find('.spinner').exists()).toBe(false)
    })
  })

  describe('when loading before delay elapses', () => {
    it('does not render the spinner', () => {
      const wrapper = mountComponent({ loading: true, delay: 300 })

      expect(wrapper.find('.spinner').exists()).toBe(false)
    })

    it('does not render slot content', () => {
      const wrapper = mountComponent({ loading: true, delay: 300 })

      expect(wrapper.find('.slotted').exists()).toBe(false)
    })

    it('unmounts cleanly when there is no active timeout', () => {
      const wrapper = mountComponent({ loading: false })

      expect(() => wrapper.unmount()).not.toThrow()
    })

    it('clears the timeout on unmount', async () => {
      const wrapper = mountComponent({ loading: true, delay: 300 })

      wrapper.unmount()
      vi.advanceTimersByTime(300)
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.spinner').exists()).toBe(false)
    })
  })

  describe('when loading after delay elapses', () => {
    it('renders the spinner', async () => {
      const wrapper = mountComponent({ loading: true, delay: 300 })

      vi.advanceTimersByTime(300)
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.spinner').exists()).toBe(true)
    })

    it('does not render slot content', async () => {
      const wrapper = mountComponent({ loading: true, delay: 300 })

      vi.advanceTimersByTime(300)
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.slotted').exists()).toBe(false)
    })

    it('renders the loading message when provided', async () => {
      const wrapper = mountComponent({
        loading: true,
        delay: 300,
        loadingMessage: 'Please wait...',
      })

      vi.advanceTimersByTime(300)
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Please wait...')
    })

    it('does not render the loading message when not provided', async () => {
      const wrapper = mountComponent({ loading: true, delay: 300 })

      vi.advanceTimersByTime(300)
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).not.toContain('mt-2')
    })
  })

  describe('when loading transitions to done', () => {
    it('hides the spinner and shows slot content', async () => {
      const wrapper = mountComponent({ loading: true, delay: 300 })

      vi.advanceTimersByTime(300)
      await wrapper.vm.$nextTick()
      expect(wrapper.find('.spinner').exists()).toBe(true)

      await wrapper.setProps({ loading: false })

      expect(wrapper.find('.spinner').exists()).toBe(false)
      expect(wrapper.find('.slotted').exists()).toBe(true)
    })

    it('clears the timeout if loading stops before delay elapses', async () => {
      const wrapper = mountComponent({ loading: true, delay: 300 })

      await wrapper.setProps({ loading: false })
      vi.advanceTimersByTime(300)
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.spinner').exists()).toBe(false)
      expect(wrapper.find('.slotted').exists()).toBe(true)
    })
  })

  describe('when using default delay', () => {
    it('shows spinner after 300ms by default', async () => {
      const wrapper = mountComponent({ loading: true })

      vi.advanceTimersByTime(299)
      await wrapper.vm.$nextTick()
      expect(wrapper.find('.spinner').exists()).toBe(false)

      vi.advanceTimersByTime(1)
      await wrapper.vm.$nextTick()
      expect(wrapper.find('.spinner').exists()).toBe(true)
    })
  })
})
