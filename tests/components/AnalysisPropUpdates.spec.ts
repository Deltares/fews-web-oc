import { expect, test } from '@playwright/test'

test.describe('analysis components update nested props immutably', () => {
  test('collection deletion emits a replacement collection list', async ({
    mount,
    page,
  }) => {
    const component = await mount('analysis/AnalysisPropUpdates/Collections')
    await component
      .getByRole('combobox', { name: 'Collection' })
      .press('ArrowDown')

    const secondCollection = page
      .locator('.v-overlay--active .v-list-item')
      .filter({ hasText: 'Second' })
    await secondCollection.locator('button').click()
    await page.getByText('Delete Collection', { exact: true }).waitFor()
    await page.getByRole('button', { name: 'Delete', exact: true }).click()

    await expect(component.getByTestId('prop-value')).toHaveText('First')
  })

  test('line style selection emits a replacement item', async ({
    mount,
    page,
  }) => {
    const component = await mount('analysis/AnalysisPropUpdates/LineStyle')
    await component
      .getByRole('combobox', { name: 'Line Style' })
      .press('ArrowDown')
    await page.getByRole('option', { name: 'Dashed' }).click()

    await expect(component.getByTestId('prop-value')).toHaveText('dashed;thick')
  })

  test('chart card title edit emits a replacement chart', async ({ mount }) => {
    const component = await mount('analysis/AnalysisPropUpdates/ChartCard')
    await component.getByRole('button', { name: 'Original title' }).click()

    const titleInput = component.getByRole('textbox', { name: 'Title' })
    await titleInput.fill('Updated card title')
    await titleInput.press('Enter')

    await expect(component.getByTestId('prop-value')).toHaveText(
      'Updated card title',
    )
  })

  test('chart editor title edit emits a replacement chart', async ({
    mount,
    page,
  }) => {
    const component = await mount('analysis/AnalysisPropUpdates/ChartEdit')
    await page.getByRole('button', { name: 'Original title' }).click()

    const titleInput = page.getByRole('textbox', { name: 'Title' })
    await titleInput.fill('Updated editor title')
    await titleInput.press('Enter')

    await expect(component.getByTestId('prop-value')).toHaveText(
      'Updated editor title',
    )
  })
})
