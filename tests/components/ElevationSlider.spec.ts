import { test, expect, type Locator } from '@playwright/test'

async function startEdit(component: Locator) {
  await component.locator('.elevation-slider__edit-button').click()
  const input = component.getByLabel('Elevation', { exact: true })
  await expect(input).toBeFocused()
  return input
}

test.describe('ElevationSlider', () => {
  test('accepts a comma as decimal separator', async ({ mount }) => {
    const component = await mount('wms/ElevationSlider/MinMax')

    const input = await startEdit(component)
    await input.fill('-12,5')
    await input.press('Enter')

    await expect(component.getByTestId('elevation-value')).toHaveText('-12.5')
  })

  test('ignores input that is not a number', async ({ mount }) => {
    const component = await mount('wms/ElevationSlider/MinMax')

    const input = await startEdit(component)
    await input.fill('5m')
    await input.press('Enter')

    await expect(component.getByTestId('elevation-value')).toHaveText('-10')
  })

  test('clamps typed values to the elevation range', async ({ mount }) => {
    const component = await mount('wms/ElevationSlider/MinMax')

    const input = await startEdit(component)
    await input.fill('-80')
    await input.press('Enter')

    await expect(component.getByTestId('elevation-value')).toHaveText('-50')
  })

  test('returns focus to the slider after Enter', async ({ mount }) => {
    const component = await mount('wms/ElevationSlider/MinMax')

    const input = await startEdit(component)
    await input.fill('-20')
    await input.press('Enter')

    await expect(component.locator('.v-slider-thumb')).toBeFocused()
  })

  test('commits on blur without stealing focus', async ({ mount }) => {
    const component = await mount('wms/ElevationSlider/MinMax')
    const otherField = component.getByLabel('Other field')

    const input = await startEdit(component)
    await input.fill('-20')
    await otherField.click()

    await expect(component.getByTestId('elevation-value')).toHaveText('-20')
    await expect(otherField).toBeFocused()
  })

  test('steps through descending ticks in ascending order', async ({
    mount,
  }) => {
    const component = await mount('wms/ElevationSlider/DescendingTicks')
    const thumb = component.locator('.v-slider-thumb')
    const value = component.getByTestId('elevation-value')

    await thumb.focus()
    await thumb.press('ArrowUp')
    await expect(value).toHaveText('-5')
    await thumb.press('ArrowUp')
    await expect(value).toHaveText('0')
    await thumb.press('ArrowUp')
    await expect(value).toHaveText('0')

    await thumb.press('ArrowDown')
    await thumb.press('ArrowDown')
    await thumb.press('ArrowDown')
    await expect(value).toHaveText('-50')
  })

  test('draws the lowest tick at the bottom', async ({ mount }) => {
    const component = await mount('wms/ElevationSlider/DescendingTicks')
    const thumb = component.locator('.v-slider-thumb')
    const value = component.getByTestId('elevation-value')
    // Vuetify measures the thumb position from the top of a vertical slider
    const position = () =>
      thumb.evaluate((el) =>
        (el as HTMLElement).style.getPropertyValue('--v-slider-thumb-position'),
      )

    await thumb.focus()
    await thumb.press('ArrowUp')
    await thumb.press('ArrowUp')
    await expect(value).toHaveText('0')
    expect(await position()).toBe('0%')

    await thumb.press('ArrowDown')
    await thumb.press('ArrowDown')
    await thumb.press('ArrowDown')
    await expect(value).toHaveText('-50')
    expect(await position()).toBe('100%')
  })

  test('snaps typed values to the nearest tick', async ({ mount }) => {
    const component = await mount('wms/ElevationSlider/DescendingTicks')

    const input = await startEdit(component)
    await input.fill('-7')
    await input.press('Enter')

    await expect(component.getByTestId('elevation-value')).toHaveText('-5')
    await expect(
      component.locator('.elevation-slider__edit-button'),
    ).toHaveText('-5')
  })

  test('exposes the elevation as aria-valuetext', async ({ mount }) => {
    const component = await mount('wms/ElevationSlider/DescendingTicks')
    const thumb = component.locator('.v-slider-thumb')

    await expect(thumb).toHaveAttribute('aria-valuetext', '-10 m')
    await thumb.focus()
    await thumb.press('ArrowDown')
    await expect(thumb).toHaveAttribute('aria-valuetext', '-50 m')
  })

  test('has a white thumb in the dark theme', async ({ mount }) => {
    const component = await mount('wms/ElevationSlider/MinMaxDark')
    await expect(component.locator('.v-slider-thumb__surface')).toHaveCSS(
      'background-color',
      'rgb(255, 255, 255)',
    )
  })
})
