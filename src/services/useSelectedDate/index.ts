import {
  inject,
  type MaybeRefOrGetter,
  provide,
  type InjectionKey,
  computed,
  toValue,
} from 'vue'

type DateRefOrGetter = MaybeRefOrGetter<Date | undefined>

const SELECTED_DATE_KEY: InjectionKey<DateRefOrGetter> = Symbol('selectedDate')

/**
 * Provide a selected date to the component tree.
 * @param date The selected date.
 */
export function provideSelectedDate(date: DateRefOrGetter) {
  provide(SELECTED_DATE_KEY, date)
}

/**
 * Get the selected date from a parent component or use a fallback date.
 * @param fallbackDate The fallback date.
 * @returns The selected date.
 */
export function useSelectedDate(
  fallbackDate: DateRefOrGetter,
  inheritDate = true,
) {
  const injectedDate = inheritDate
    ? inject(SELECTED_DATE_KEY, fallbackDate)
    : fallbackDate

  const selectedDate = computed(() => toValue(injectedDate))

  const dateTimeSliderEnabled = computed(() => {
    const hasInjectedDate =
      inheritDate && inject(SELECTED_DATE_KEY, null) !== null
    return !hasInjectedDate
  })

  return {
    selectedDate,
    dateTimeSliderEnabled,
  }
}
