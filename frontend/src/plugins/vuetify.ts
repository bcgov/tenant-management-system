import * as tokens from '@bcgov/design-tokens/js-prefixed'
import { createVuetify, type ThemeDefinition } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import 'vuetify/styles'

// Define a custom Vuetify theme that uses the BC Government design tokens.
const bcgovLight: ThemeDefinition = {
  colors: {
    // Set both the background and surface to the default white background from
    // the design tokens. Vuetify uses 'background' for the app-level background
    // and 'surface' for container-level elements like cards.
    background: tokens.bcdsSurfaceColorBackgroundWhite,
    surface: tokens.bcdsSurfaceColorBackgroundWhite,
    'on-surface': tokens.bcdsTypographyColorPrimary,

    // Colours for primary button.
    primary: tokens.bcdsThemePrimaryBlue,
    'primary-hover': tokens.bcdsSurfaceColorPrimaryButtonHover,

    // Colours for secondary button - note that these are overridden because the
    // BCGov design system conflicts with Vuetify's secondary button styles.
    secondary: tokens.bcdsSurfaceColorSecondaryDefault,
    'on-secondary': tokens.bcdsTypographyColorSecondary,
    'secondary-disabled': tokens.bcdsSurfaceColorSecondaryButtonDisabled,
    'secondary-hover': tokens.bcdsSurfaceColorSecondaryButtonHover,

    // Colours for application notifications.
    error: tokens.bcdsSupportBorderColorDanger,
    info: tokens.bcdsSupportBorderColorInfo,
    success: tokens.bcdsSupportBorderColorSuccess,
    warning: tokens.bcdsSupportBorderColorWarning,

    // Custom colours.
    'surface-input-disabled': tokens.bcdsSurfaceColorFormsDisabled,
    'surface-light-blue': tokens.bcdsSurfaceColorBackgroundLightBlue,
    'surface-light-gray': tokens.bcdsSurfaceColorBackgroundLightGray,
    'typography-input-disabled': tokens.bcdsTypographyColorDisabled,
    'typography-link-color': tokens.bcdsTypographyColorLink,
    'typography-link-color-hover': tokens.bcdsSurfaceColorBorderActive,
  },

  dark: false,
}

// Create a Vuetify instance with custom settings.
const vuetify = createVuetify({
  // Tree shake the components and directives.
  components,
  directives,

  // Use the Material Design Icons (MDI) icon set.
  icons: {
    aliases,
    defaultSet: 'mdi',
    sets: { mdi },
  },

  // Use the custom theme defined above.
  theme: {
    defaultTheme: 'bcgovLight',
    themes: {
      bcgovLight,
    },
  },
})

export default vuetify
