import { test, expect } from '@playwright/test'

const base =
  '/topology/early_warning/node/viewer_rivers_level_stations/viewer_rivers_level_stations_forecast/map/waterdepth_sfincs_inland/location/Umgeni_Mouth_level'

test.describe('Default time settings', () => {
  test('should display the correct time settings', async ({ page }) => {
    await page.goto(base)
    // Get all image elements with the specified text
    const timelineImages = page
      .getByRole('img')
      .filter({ hasText: 'Mar 09Tue 11Thu 13Sat 15Mon 17Wed 19' })

    // Check that we have exactly 2 of these elements
    await expect(timelineImages).toHaveCount(2)

    // Check that both are visible
    await expect(timelineImages.nth(0)).toBeVisible()
    await expect(timelineImages.nth(1)).toBeVisible()
  })

  test('should change time range by dragging on timeline', async ({ page }) => {
    // Navigate to the same page
    await page.goto(base)

    // Get the first timeline image
    const timelineImage = page
      .getByRole('img')
      .filter({ hasText: 'Mar 09Tue 11Thu 13Sat 15Mon 17Wed 19' })
      .first()

    // Wait for the timeline to be visible
    await timelineImage.waitFor({ state: 'visible' })

    // Get the text elements for our start and end points
    const startElement = page.getByText('Tue').first()
    const endElement = page.getByText('Sat').first()

    // Get the bounding boxes
    const startBox = await startElement.boundingBox()
    const endBox = await endElement.boundingBox()

    if (!startBox || !endBox) {
      throw new Error('Timeline text elements not found or not visible')
    }

    // Calculate positions for the start and end of the drag
    // Use the middle of each text element horizontally and 20px above vertically
    const startX = startBox.x + startBox.width / 2
    const endX = endBox.x + endBox.width / 2
    const dragY = startBox.y - 20 // 20 pixels above the text elements

    // Perform the drag operation
    await page.mouse.move(startX, dragY)
    await page.mouse.down()
    await page.mouse.move(endX, dragY, { steps: 10 }) // Move in steps for smoother drag
    await page.mouse.up()

    const timelineImages = page
      .getByRole('img')
      .filter({ hasText: 'Wed 12Thu 13Fri 14Sat 15' })

    // Check that we have exactly 2 of these elements
    await expect(timelineImages).toHaveCount(2)

    // Check that both are visible
    await expect(timelineImages.nth(0)).toBeVisible()
    await expect(timelineImages.nth(1)).toBeVisible()
  })

  test('should reset time range by double-clicking on timeline', async ({
    page,
  }) => {
    // Navigate to the same page
    await page.goto(base)

    // Get the first timeline image
    const timelineImage = page
      .getByRole('img')
      .filter({ hasText: 'Mar 09Tue 11Thu 13Sat 15Mon 17Wed 19' })
      .first()

    // Wait for the timeline to be visible
    await timelineImage.waitFor({ state: 'visible' })

    // First, let's change the time range by dragging
    // Get the text elements for our start and end points
    const startElement = page.getByText('Tue').first()
    const endElement = page.getByText('Sat').first()

    // Get the bounding boxes
    const startBox = await startElement.boundingBox()
    const endBox = await endElement.boundingBox()

    if (!startBox || !endBox) {
      throw new Error('Timeline text elements not found or not visible')
    }

    // Perform the drag operation to select a time range
    const startX = startBox.x + startBox.width / 2
    const endX = endBox.x + endBox.width / 2
    const dragY = startBox.y - 20

    await page.mouse.move(startX, dragY)
    await page.mouse.down()
    await page.mouse.move(endX, dragY, { steps: 10 })
    await page.mouse.up()

    // Verify that the time range has changed
    const changedTimelineImages = page
      .getByRole('img')
      .filter({ hasText: 'Wed 12Thu 13Fri 14Sat 15' })
    await expect(changedTimelineImages).toHaveCount(2)
    await expect(changedTimelineImages.nth(0)).toBeVisible()
    await expect(changedTimelineImages.nth(1)).toBeVisible()
    // Now, double-click to reset the time range
    await page.mouse.dblclick(startBox.x, startBox.y - 20)

    // Verify that the time range has been reset to the default
    const resetTimelineImages = page
      .getByRole('img')
      .filter({ hasText: 'Mar 09Tue 11Thu 13Sat 15Mon 17Wed 19' })
    await expect(resetTimelineImages).toHaveCount(2)
    await expect(resetTimelineImages.nth(0)).toBeVisible()
    await expect(resetTimelineImages.nth(1)).toBeVisible()
  })

  test('should pan time range by dragging with Shift key pressed', async ({
    page,
  }) => {
    // Navigate to the same page
    await page.goto(base)

    // Get the first timeline image
    const timelineImage = page
      .getByRole('img')
      .filter({ hasText: 'Mar 09Tue 11Thu 13Sat 15Mon 17Wed 19' })
      .first()

    // Wait for the timeline to be visible
    await timelineImage.waitFor({ state: 'visible' })

    // Get a reference point in the middle of the timeline
    const timelineBox = await timelineImage.boundingBox()

    if (!timelineBox) {
      throw new Error('Timeline element not found or not visible')
    }

    // Calculate the middle point of the timeline for panning
    const middleX = timelineBox.x + timelineBox.width / 2
    const middleY = timelineBox.y + timelineBox.height / 2

    // Calculate pan distance - move to the right to go forward in time
    // or move to the left to go backward in time
    const panDistance = timelineBox.width / 4 // Move 25% of the timeline width to the left

    // Perform the panning operation while holding Shift key
    await page.keyboard.down('Shift')
    await page.mouse.move(middleX, middleY)
    await page.mouse.down()
    await page.mouse.move(middleX - panDistance, middleY, { steps: 10 }) // Move left to go backward in time
    await page.mouse.up()
    await page.keyboard.up('Shift')

    // Verify that the time range has been panned
    const pannedTimelineImages = page
      .getByRole('img')
      .filter({ hasText: 'Tue 11Thu 13Sat 15Mon 17Wed 19Fri 21' })

    // Check that we have elements with the panned time range
    await expect(pannedTimelineImages).toHaveCount(2)
    await expect(pannedTimelineImages.nth(0)).toBeVisible()
    await expect(pannedTimelineImages.nth(1)).toBeVisible()
  })
})
