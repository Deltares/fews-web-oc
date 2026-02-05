import { test, expect } from '@playwright/test'
import fs from 'fs'

const base = '/topology/early_warning/node'

test.describe('Download Time Series', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(
      `${base}/viewer_coastal_water_levels/viewer_coastal_water_levels_d3d/map/kzn_waterlevel/location/NSRI_Tide_Gauge_level`,
    )
    const actionmenu = page.locator('button[name="Time series actions"]')
    // Wait for the action menu to be visible
    await expect(actionmenu).toBeVisible()
    await actionmenu.click()
  })

  test('Should download in CSV format', async ({ page }) => {
    await page.getByText('Download time series').click()

    const dialog = page.getByTestId('time-series-file-download')
    await expect(dialog).toBeVisible()

    // Set up the download promise before clicking the download button
    const downloadPromise = page.waitForEvent('download')
    await dialog.getByRole('button', { name: 'Download' }).click()
    // Wait for the download to complete
    const download = await downloadPromise
    const path = await download.path()

    expect(path).toBeDefined()
    // Check the file content structure
    const content = fs.readFileSync(path, 'utf8')

    // Check if content follows CSV format (contains commas, line breaks)
    expect(content).toContain(',') // CSV files should have comma separators
    const lines = content.split('\n')
    expect(lines.length).toBeGreaterThan(1) // Should have multiple lines

    // Check if columns are consistent
    const headerColumns = lines[0].split(',').length
    // Check a few lines to make sure they have the same number of columns
    if (lines.length > 1) {
      expect(lines[1].split(',').length).toBe(headerColumns)
    }
  })

  test('Should download in JSON format', async ({ page }) => {
    await page.getByText('Download time series').click()

    const dialog = page.getByTestId('time-series-file-download')
    await expect(dialog).toBeVisible()

    // Select JSON format instead of default CSV
    await dialog.getByRole('button', { name: 'csv' }).click()
    await page.getByRole('listitem').filter({ hasText: 'json' }).click

    // Set up the download promise before clicking the download button
    const downloadPromise = page.waitForEvent('download')
    await dialog.getByRole('button', { name: 'Download' }).click()
    // Wait for the download to complete
    const download = await downloadPromise
    const path = await download.path()

    expect(path).toBeDefined()

    // Check the file content structure
    const content = fs.readFileSync(path, 'utf8')

    // Verify content is valid JSON
    let jsonData
    expect(() => {
      jsonData = JSON.parse(content)
    }).not.toThrow()

    // Additional checks on the JSON structure
    expect(jsonData).toBeDefined()
    expect(typeof jsonData === 'object').toBeTruthy()

    // Check for expected properties in the JSON data based on actual structure
    expect(jsonData).toHaveProperty('timeSeries')
    expect(jsonData).toHaveProperty('version')
    expect(jsonData).toHaveProperty('timeZone')

    // Check timeSeries array structure
    expect(Array.isArray(jsonData.timeSeries)).toBeTruthy()
    expect(jsonData.timeSeries.length).toBeGreaterThan(0)

    // Check first time series object structure
    const firstTimeSeries = jsonData.timeSeries[0]
    expect(firstTimeSeries).toHaveProperty('header')
    expect(firstTimeSeries).toHaveProperty('events')

    // Check header properties
    expect(firstTimeSeries.header).toHaveProperty('locationId')
    expect(firstTimeSeries.header).toHaveProperty('parameterId')

    // Check events array
    expect(Array.isArray(firstTimeSeries.events)).toBeTruthy()
    if (firstTimeSeries.events.length > 0) {
      // Check event structure
      const firstEvent = firstTimeSeries.events[0]
      expect(firstEvent).toHaveProperty('date')
      expect(firstEvent).toHaveProperty('time')
      expect(firstEvent).toHaveProperty('value')
      expect(firstEvent).toHaveProperty('flag')
    }
  })

  test('Should download in XML format', async ({ page }) => {
    await page.getByText('Download time series').click()

    const dialog = page.getByTestId('time-series-file-download')
    await expect(dialog).toBeVisible()

    // Select XML format instead of default CSV
    await dialog.getByRole('button', { name: 'csv' }).click()
    await page.getByRole('listitem').filter({ hasText: 'xml' }).click()

    // Set up the download promise before clicking the download button
    const downloadPromise = page.waitForEvent('download')
    await dialog.getByRole('button', { name: 'Download' }).click()
    // Wait for the download to complete
    const download = await downloadPromise
    const path = await download.path()

    expect(path).toBeDefined()

    // Check the file content structure
    const content = fs.readFileSync(path, 'utf8')

    // Basic XML validation checks
    expect(content).toContain('<?xml') // XML declaration
    expect(content).toContain('<TimeSeries') // Root element

    expect(content).toContain('<series>') // Series section
    expect(content).toContain('<header>') // Header section
    expect(content).toContain('<locationId>') // Location ID
    expect(content).toContain('<parameterId>') // Parameter ID
    expect(content).toContain('<event') // Event entries

    // Check if XML is well-formed by counting opening and closing tags
    // This is a simple check - a full XML parser would be more accurate
    const openTags = (content.match(/<[^/][^>]*>/g) || []).length
    const closeTags = (content.match(/<\/[^>]+>/g) || []).length
    expect(openTags).toBeGreaterThan(0)
    expect(closeTags).toBeGreaterThan(0)
  })
})
