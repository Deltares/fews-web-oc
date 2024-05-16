// Vuetify
import '@/styles/main.scss'
import '@mdi/font/css/materialdesignicons.css'
import { createVuetify, type ThemeDefinition } from 'vuetify'

const light: ThemeDefinition = {
  dark: false,
  colors: {
    surface: '#dddbd0',
    'surface-bright': '#FFFFFF',
    'surface-light': '#EEEEEE',
    'surface-variant': '#424242',
    'on-surface-variant': '#EEEEEE',
    background: '#dddbd0',
    primary: '#3f51b5',
    secondary: '#b0bec5',
    accent: '#dddbd0',
    error: '#b71c1c',


    'primary-darken-1': '#1F5592',
    'secondary-darken-1': '#018786',
    info: '#2196F3',
    success: '#4CAF50',
    warning: '#FB8C00',

  },
}

const dark: ThemeDefinition = {
  dark: true,
  colors: {
    surface: '#22242F',
    'surface-light': '#323546',
    'on-surface-variant': '#323546',
    'surface-variant': '#3D4054',
    background: '#22242F',
    primary: '#6267B5',
    secondary: '#b0bec5',
    accent: '#22242F',
    error: '#b71c1c',
  },
  variables: {
    themeOnSurfaceLight: 1
  }
}

const vuetify = createVuetify({
  theme: {
    defaultTheme: 'dark',
    themes: {
      light,
      dark,
    },
  },
})

export default vuetify
