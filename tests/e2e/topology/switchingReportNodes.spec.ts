import { test, expect } from '@playwright/test'

const base = '/topology/early_warning/node'

test.describe('Switching Nodes with ReportsDisplayView', () => {
  test('when selecting topology node with reports the current report should be visible', async ({
    page,
  }) => {
    await page.goto(
      `${base}/viewer_meteorology_rainfall_observed/viewer_meteorology_rainfall_observed_rain_gauges/reports`,
    )

    await expect(page.getByText('Rainfall return period report')).toBeVisible()

    await expect(
      page.getByRole('button', { name: 'Download Report' }),
    ).toBeVisible()

    const combo = page
      .getByRole('combobox')
      .filter({ hasText: 'Analysis timeAnalysis' })
    await expect(combo).toBeVisible()

    await combo.click()
    const list = await page.getByRole('listbox', { name: 'Analysis time-list' })
    await expect(list.getByText('2025-03-14T10:00:00Z')).toBeVisible()
    await expect(list.getByText('Current', { exact: true })).toBeVisible()
  })

  test('when selecting topology node with no reports the no report should be visible', async ({
    page,
  }) => {
    await page.goto(
      `${base}/viewer_meteorology_rainfall_forecast/viewer_meteorology_rainfall_forecast_saws_1x1/reports`,
    )

    await expect(page.getByText('No reports available')).toBeVisible()
  })

  test('when switching to a topology node with no reports the no report should be visible', async ({
    page,
  }) => {
    await page.goto(
      `${base}/viewer_meteorology_rainfall_observed/viewer_meteorology_rainfall_observed_rain_gauges/reports`,
    )
    await page.goto(
      `${base}/viewer_meteorology_rainfall_forecast/viewer_meteorology_rainfall_forecast_saws_1x1/reports`,
    )

    await expect(page.getByText('No reports available')).toBeVisible()
  })
})
