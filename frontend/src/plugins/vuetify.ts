import * as tokens from '@bcgov/design-tokens/js'
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
    background: tokens.surfaceColorBackgroundWhite,
    surface: tokens.surfaceColorBackgroundWhite,
    'on-surface': tokens.typographyColorPrimary,

    // Colours for primary button.
    primary: tokens.themePrimaryBlue,
    'primary-hover': tokens.surfaceColorPrimaryButtonHover,

    // Colours for secondary button - note that these are overridden because the
    // BCGov design system conflicts with Vuetify's secondary button styles.
    secondary: tokens.surfaceColorSecondaryDefault,
    'on-secondary': tokens.typographyColorSecondary,
    'secondary-disabled': tokens.surfaceColorSecondaryButtonDisabled,
    'secondary-hover': tokens.surfaceColorSecondaryButtonHover,

    // Colours for application notifications.
    error: tokens.supportBorderColorDanger,
    info: tokens.supportBorderColorInfo,
    success: tokens.supportBorderColorSuccess,
    warning: tokens.supportBorderColorWarning,

    // Custom colours.
    'surface-input-disabled': tokens.surfaceColorFormsDisabled,
    'surface-light-blue': tokens.surfaceColorBackgroundLightBlue,
    'surface-light-gray': tokens.surfaceColorBackgroundLightGray,
    'typography-input-disabled': tokens.typographyColorDisabled,
    'typography-link-color': tokens.typographyColorLink,
    'typography-link-color-hover': tokens.surfaceColorBorderActive,
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

  // Use BC Sans for everything by default.
  defaults: {
    global: {
      style: `font-family: ${tokens.typographyFontFamiliesBcSans} !important`,
    },
  },
})

export default vuetify
