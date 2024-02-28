import { en, nl } from 'vuetify/locale'
import enCustom from './en.json'
import nlCustom from './nl.json'

export const messages = {
  en: {
    $vuetify: {
      ...en,
    },
    ...enCustom,
  },
  nl: {
    $vuetify: {
      ...nl,
    },
    ...nlCustom,
  },
}
