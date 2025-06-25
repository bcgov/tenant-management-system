import * as tokens from '@bcgov/design-tokens/js'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import 'vuetify/styles'

// Define a custom Vuetify theme that uses the BC Government design tokens.
const bcgovTheme = {
  dark: false,
  colors: {
    // Background colors using BC tokens
    background: tokens.surfaceColorBackgroundWhite,
    surface: tokens.surfaceColorSecondaryDefault,
    'surface-bright': tokens.surfaceColorBackgroundWhite,
    'surface-light': tokens.surfaceColorBackgroundLightGray,
    'surface-variant': tokens.themeGray40,
    'on-surface-variant': tokens.typographyColorSecondary,

    // Primary colors using BC blue theme
    primary: tokens.themePrimaryBlue,
    'primary-darken-1': tokens.surfaceColorPrimaryPressed,

    // Secondary colors
    secondary: tokens.surfaceColorSecondaryDefault,
    'secondary-darken-1': tokens.surfaceColorSecondaryPressed,

    // Status colors using BC support colors
    error: tokens.supportBorderColorDanger,
    info: tokens.supportBorderColorInfo,
    success: tokens.supportBorderColorSuccess,
    warning: tokens.supportBorderColorWarning,
  },
  variables: {
    // Border styling using BC tokens
    'border-color': tokens.surfaceColorBorderDefault,
    'border-opacity': tokens.surfaceOpacity20,

    // Opacity levels using BC tokens
    'high-emphasis-opacity': tokens.surfaceOpacity90,
    'medium-emphasis-opacity': tokens.surfaceOpacity60,
    'disabled-opacity': tokens.surfaceOpacity40,
    'idle-opacity': tokens.surfaceOpacity10,
    'hover-opacity': tokens.surfaceOpacity10,
    'focus-opacity': tokens.surfaceOpacity20,
    'selected-opacity': tokens.surfaceOpacity20,
    'activated-opacity': tokens.surfaceOpacity30,
    'pressed-opacity': tokens.surfaceOpacity30,
    'dragged-opacity': tokens.surfaceOpacity20,

    // Code and keyboard colors
    'theme-kbd': tokens.themeGray100,
    'theme-on-kbd': tokens.typographyColorPrimaryInvert,
    'theme-code': tokens.themeGray20,
    'theme-on-code': tokens.typographyColorPrimary,
  },
}

// Create a Vuetify instance with custom settings
const vuetify = createVuetify({
  components,
  directives,
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: { mdi },
  },
  theme: {
    defaultTheme: 'bcgovTheme',
    themes: {
      bcgovTheme,
    },
  },
  defaults: {
    global: {
      style: `font-family: ${tokens.typographyFontFamiliesBcSans} !important`,
    },
    VCard: {
      elevation: 0,
      style: `box-shadow: ${tokens.surfaceShadowMedium}`,
    },
  },
})

export default vuetify
