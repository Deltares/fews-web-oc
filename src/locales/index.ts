import { en, nl } from 'vuetify/locale'
import enCustom from './en.json'
import nlCustom from './nl.json'
import type { DateTimeFormat } from '@intlify/core-base'

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

export const datetimeFormats: Record<keyof typeof messages, DateTimeFormat> = {
  en: {
    time: {
      hour: 'numeric',
      minute: 'numeric',
      timeZoneName: 'short',
    },
    datetimeslider: {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: true,
    },
  },
  nl: {
    time: {
      hour: 'numeric',
      minute: 'numeric',
      timeZoneName: 'short',
    },
    datetimeslider: {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    },
  },
} as const
