import { test, expect } from '@playwright/test'

test('resets shared time domains even when the visible domain does not change', async ({
  mount,
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  const component = await mount('charts/v5/TimeSeriesChartV5/SharedTimeReset')
  const charts = component.locator('.chart-v5 .chart-container > svg')
  await expect(charts).toHaveCount(2)
  await expect(charts.first()).toBeVisible()

  for (const selection of ['Select full', 'Select part']) {
    await component.getByRole('button', { name: selection }).click()
    await expect(component.locator('output')).toHaveText('zoomed')
    await charts.first().dblclick()
    await expect(component.locator('output')).toHaveText('following')
  }
  expect(errors).toEqual([])
})
