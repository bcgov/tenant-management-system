/**
 * Helper function to determine if a Vuetify element is disabled based on its
 * class. This is somewhat fragile in case Vuetify changes its class names in
 * future versions, but it allows an update in one place.
 *
 * @param element the element to check for the disabled class.
 * @returns true if the element has the disabled class, false otherwise.
 */
export function isVuetifyDisabled(element: HTMLElement): boolean {
  return element.classList.contains('v-list-item--disabled')
}
