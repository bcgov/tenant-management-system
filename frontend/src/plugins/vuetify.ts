import * as tokens from '@bcgov/design-tokens/js-prefixed'
import { createVuetify, type ThemeDefinition } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg'
import 'vuetify/styles'

// Define a custom Vuetify theme that uses the BC Government design tokens.
const bcgovLight: ThemeDefinition = {
  // Colours that use the design token. Keys with the "-custom" suffix are
  // custom (non-Vuetify theme) colours.
  colors: {
    // Background is the white defined by the design system.
    background: tokens.bcdsSurfaceColorBackgroundWhite,
    'on-background': tokens.bcdsTypographyColorPrimary,

    // Surface are a choice from the design system: use light gray.
    surface: tokens.bcdsSurfaceColorBackgroundLightGray,
    'on-surface': tokens.bcdsTypographyColorPrimary,
    'surface-hover-custom': tokens.bcdsSurfaceColorSecondaryHover,

    // Colours for primary button.
    primary: tokens.bcdsSurfaceColorPrimaryDefault,
    'primary-disabled-custom': tokens.bcdsSurfaceColorPrimaryDisabled,
    'primary-hover-custom': tokens.bcdsSurfaceColorPrimaryButtonHover,

    // Colours for secondary button - note that these are overridden because the
    // BCGov design system conflicts with Vuetify's secondary button styles.
    secondary: tokens.bcdsSurfaceColorSecondaryDefault,
    'on-secondary': tokens.bcdsTypographyColorSecondary,
    'secondary-disabled-custom': tokens.bcdsSurfaceColorSecondaryButtonDisabled,
    'secondary-hover-custom': tokens.bcdsSurfaceColorSecondaryButtonHover,

    // Colours for application notifications.
    error: tokens.bcdsSupportBorderColorDanger,
    info: tokens.bcdsSupportBorderColorInfo,
    success: tokens.bcdsSupportBorderColorSuccess,
    warning: tokens.bcdsSupportBorderColorWarning,

    // Other custom colour from the BCDS.
    'surface-gold-10-custom': tokens.bcdsThemeGold10,
    'surface-light-blue-custom': tokens.bcdsSurfaceColorBackgroundLightBlue,
    'surface-input-disabled-custom': tokens.bcdsSurfaceColorFormsDisabled,
    'typography-link-color-custom': tokens.bcdsTypographyColorLink,
  },

  dark: false,

  variables: {
    'high-emphasis-opacity': 1,
  },
}

// Create a Vuetify instance with custom settings.
const vuetify = createVuetify({
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
