import { en, nl } from 'vuetify/locale'
import enCustom from './en.json'
import nlCustom from './nl.json'
import type { DateTimeFormatOptions } from '@intlify/core-base'

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

export type DateTimeFormatWithOverride = {
  [key: string]: DateTimeFormatOptions & { overrideTimeZone?: boolean }
}

export const datetimeFormats: Record<
  keyof typeof messages,
  DateTimeFormatWithOverride
> = {
  en: {
    datetimeslider: {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
      timeZone: 'UTC',
      overrideTimeZone: true,
    },
    table: {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      timeZone: 'UTC',
      overrideTimeZone: true,
    },
    time: {
      hour: 'numeric',
      minute: 'numeric',
      timeZoneName: 'short',
      timeZone: 'UTC',
      overrideTimeZone: true,
    },
  },
  nl: {
    datetimeslider: {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      timeZone: 'Europe/Amsterdam',
      overrideTimeZone: true,
    },
    table: {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      timeZone: 'Europe/Amsterdam',
      overrideTimeZone: true,
    },
    time: {
      hour: 'numeric',
      minute: 'numeric',
      timeZoneName: 'short',
      timeZone: 'Europe/Amsterdam',
      overrideTimeZone: true,
    },
  },
} as const
