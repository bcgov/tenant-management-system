import { config } from '@vue/test-utils'
import { i18n } from './src/i18n'

config.global.plugins.push(i18n)

Object.defineProperty(globalThis, 'visualViewport', {
  value: {
    addEventListener: () => {},
    height: 768,
    offsetLeft: 0,
    offsetTop: 0,
    pageLeft: 0,
    pageTop: 0,
    removeEventListener: () => {},
    scale: 1,
    width: 1024,
  },
  writable: true,
})

globalThis.requestAnimationFrame = (cb) => {
  cb(0)

  return 0
}

globalThis.ResizeObserver = class ResizeObserver {
  disconnect() {
    return this
  }

  observe(_el: Element) {
    return _el
  }

  unobserve(_el: Element) {
    return _el
  }
}
