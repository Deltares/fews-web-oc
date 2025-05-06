import { expect, test } from '@playwright/test'
import { loadHomePage } from './helpers/common'

test.describe('Location click behavior', () => {
  test('Should display time series graphs when clicking on a location', async ({
    page,
  }) => {
    // Load the application home page
    await loadHomePage(page)

    await page.goto('/topology/node/northern_hemisphere/map/location/Spain')

    // Wait for the time series graph to load and be visible
    await page.locator('svg.wb-charts').first().waitFor({ state: 'visible' })

    // Check if we have 2 graphs
    const graphs = await page.locator('svg.wb-charts').count()
    expect(graphs).toBe(2)

    // Expect a number of black dots slightly less than 168 (hours in a week)
    // Some are missing randomly due to the data generation process
    const pathElements = await page.locator('svg.wb-charts path[d^="M2."]')
    const numberOfPaths = await pathElements.count()
    expect(numberOfPaths > 130 && numberOfPaths <= 168).toBeTruthy()

    // Check if we have a line with color rgb(128, 22, 80)
    const chartElement = await page.locator(
      'g[style*="stroke: rgb(128, 22, 80)"]',
    )
    const numberOfLines = await chartElement.count()
    expect(numberOfLines).toBe(1)
  })
  test('Should display table with some data when clicked', async ({ page }) => {
    // Load the application home page
    await loadHomePage(page)

    await page.goto('/topology/node/northern_hemisphere/map/location/Spain')

    // Wait for the time series graph to load and be visible
    await page.locator('svg.wb-charts').first().waitFor({ state: 'visible' })

    // Find the table button and click it
    await page.getByRole('button', { name: 'Table' }).click()
    // Sleep
    await page.waitForTimeout(1000) // Wait for the table to load
    // Wait for the table to load and be visible
    // Select td elements with the class wb-table__cell--value
    const tableCells = await page.locator('td').count()
    expect(tableCells).toBeGreaterThan(130)
    // Check if the table has a header with the text "Date"
    const tableHeader = await page.locator('th:has-text("Date")').count()
    expect(tableHeader).toBeGreaterThan(0)
    // Check if some data is doubtful
    const doubtfulCircle = await page.locator(
      'div.circle[style*="--flag-doubtful-color"]',
    )
    expect(doubtfulCircle.first()).toBeVisible()
    expect(await doubtfulCircle.count()).toBeGreaterThan(0)
    // Check if a flag shows up when hovering over the doubtful circle
    doubtfulCircle.first().hover()
    const flag = await page.getByText('Doubtful').first()
    expect(flag).toBeVisible()
  })

  test('Should show more data when switching time period to last month', async ({
    page,
  }) => {
    // Load the application home page
    await loadHomePage(page)

    await page.goto('/topology/node/northern_hemisphere/map/location/Spain')

    // Wait for the time series graph to load and be visible
    await page.locator('svg.wb-charts').first().waitFor({ state: 'visible' })

    // Count the initial number of data points (dots in the chart)
    const initialPathElements = await page.locator(
      'svg.wb-charts path[d^="M2."]',
    )
    const initialDataPointCount = await initialPathElements.count()

    // Find and click the time menu button (button with time and chevron-down icon)
    await page.getByRole('button', { name: /^\d{2}:\d{2}.*/ }).click()

    // Wait for the menu to appear and click on "Last month" option
    // This assumes there's a "Last month" option in a list somewhere in the menu
    await page.getByText('Period presets').waitFor({ state: 'visible' })

    // This locates the menu item after the "Period presets" subheader
    const items = await page
      .locator('.v-list-item')
      .filter({ hasText: /month/i })
      .all()
    await items[0].click()

    // Wait for the chart to update - look for chart loading indicator to disappear
    await page.waitForTimeout(1000) // Give time for the chart to update

    // Count the new number of data points
    const updatedPathElements = await page.locator(
      'svg.wb-charts path[d^="M2."]',
    )
    const updatedDataPointCount = await updatedPathElements.count()

    // Verify we have significantly more data points now (approximately 4-5x more)
    // A month (30 days) has ~720 hours vs ~168 hours in a week
    expect(updatedDataPointCount).toBeGreaterThan(initialDataPointCount * 2)
    console.log(
      `Initial data points: ${initialDataPointCount}, Updated: ${updatedDataPointCount}`,
    )
  })
})
