import { test, expect, type Page } from '@playwright/test'
import { describeFromVersion } from '../utils/versionedTest'
import fs from 'fs'

const mapUrl =
  'topology/early_warning/node/viewer_coastal_water_temp/viewer_coastal_water_temp_d3d/map/kzn_z_temperature_d3d'

async function enableDataDownloadTools(page: Page) {
  await page.getByRole('button', { name: 'User Settings' }).click()
  await page.getByRole('button', { name: 'All User Settings' }).click()
  const toggle = page.getByRole('checkbox', {
    name: 'Show map data download',
  })
  await toggle.click()
  await page.getByRole('button', { name: 'Close User Settings' }).click()
}

describeFromVersion('202502', 'Download NetCDF', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(mapUrl)
    await enableDataDownloadTools(page)
  })

  test('should show the NetCDF download button on the map', async ({
    page,
  }) => {
    const downloadButton = page.getByTitle('Download NetCDF')
    await expect(downloadButton).toBeVisible()
  })

  test('should open the download dialog when clicking the download button', async ({
    page,
  }) => {
    const downloadButton = page.getByTitle('Download NetCDF')
    await downloadButton.click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText('Download NetCDF')).toBeVisible()
  })

  test('should have start and end time pre-filled from layer capabilities', async ({
    page,
  }) => {
    const downloadButton = page.getByTitle('Download NetCDF')
    await downloadButton.click()

    const startTime = page.getByLabel('Start Time')
    const endTime = page.getByLabel('End Time')
    await expect(startTime).toBeVisible()
    await expect(endTime).toBeVisible()

    // Times should be pre-filled from layer capabilities
    await expect(startTime).not.toHaveValue('')
    await expect(endTime).not.toHaveValue('')
  })

  test('should download a full grid NetCDF file as a zip containing .nc files', async ({
    page,
  }) => {
    test.setTimeout(60_000)

    const downloadButton = page.getByTitle('Download NetCDF')
    await downloadButton.click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // Full Grid should be selected by default
    await expect(dialog.getByText('Full Grid')).toBeVisible()

    // Set up the download promise before clicking download
    const downloadPromise = page.waitForEvent('download', { timeout: 50_000 })
    await dialog.getByRole('button', { name: 'Download' }).click()

    const download = await downloadPromise
    const downloadPath = await download.path()
    expect(downloadPath).toBeDefined()

    // Read the file and verify it is a valid zip (magic bytes: PK\x03\x04)
    const fileBuffer = fs.readFileSync(downloadPath)
    expect(fileBuffer[0]).toBe(0x50) // 'P'
    expect(fileBuffer[1]).toBe(0x4b) // 'K'
    expect(fileBuffer[2]).toBe(0x03)
    expect(fileBuffer[3]).toBe(0x04)

    // Verify the file has a reasonable size (at least 1KB)
    expect(fileBuffer.length).toBeGreaterThan(1024)
  })

  test('should show point cloud options when selecting Point Cloud download type', async ({
    page,
  }) => {
    const downloadButton = page.getByTitle('Download NetCDF')
    await downloadButton.click()

    const dialog = page.getByRole('dialog').getByText('Full Grid')
    await expect(dialog).toBeVisible()

    // Switch to Point Cloud download type
    await dialog.click()
    await page.getByRole('option', { name: 'Point Cloud' }).click()

    // The draw bounding box button should appear
    await expect(
      page.getByRole('button', { name: 'Draw Bounding Box' }),
    ).toBeVisible()

    // Download button should be disabled without a bounding box
    await expect(page.getByRole('button', { name: 'Download' })).toBeDisabled()
  })

  test('should close the dialog when clicking cancel', async ({ page }) => {
    const downloadButton = page.getByTitle('Download NetCDF')
    await downloadButton.click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    await dialog.getByRole('button', { name: 'Cancel' }).click()
    await expect(dialog).not.toBeVisible()
  })
})
