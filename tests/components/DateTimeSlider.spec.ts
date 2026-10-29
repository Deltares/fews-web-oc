import { test, expect, type Locator } from '@playwright/test'

async function visibleTickLabelBoxes(component: Locator) {
  const labels = component.locator('.v-slider-track__tick-label')
  const boxes = []
  for (const label of await labels.all()) {
    if (await label.isVisible()) boxes.push((await label.boundingBox())!)
  }
  return boxes
}

for (const story of ['Wide', 'Narrow']) {
  test(`${story}: date labels do not overlap`, async ({ mount }) => {
    const component = await mount(`general/DateTimeSlider/${story}`)

    await component.locator('.v-slider-track__tick').first().hover()
    const boxes = await visibleTickLabelBoxes(component)
    expect(boxes.length).toBeGreaterThan(1)

    boxes.sort((a, b) => a.x - b.x)
    for (let i = 1; i < boxes.length; i++) {
      expect(boxes[i].x).toBeGreaterThanOrEqual(
        boxes[i - 1].x + boxes[i - 1].width,
      )
    }
  })
}

test('keeps the thumb label visible while dragging off the thumb', async ({
  mount,
}) => {
  const component = await mount('general/DateTimeSlider/Wide')
  const page = component.page()
  const thumb = component.locator('.v-slider-thumb')
  const label = component.locator('.datetime-slider__tooltip--arrow')

  await expect(label).toBeHidden()

  const box = (await thumb.boundingBox())!
  const x = box.x + box.width / 2
  const y = box.y + box.height / 2
  await page.mouse.move(x, y)
  await expect(label).toBeVisible()

  await page.mouse.down()
  // Drag along the track with the pointer well below the thumb
  await page.mouse.move(x + 100, y + 20, { steps: 10 })
  await expect(label).toBeVisible()

  await page.mouse.up()
  await expect(label).toBeHidden()
})

test('shows the thumb label on keyboard focus', async ({ mount, page }) => {
  const component = await mount('general/DateTimeSlider/Wide')
  const label = component.locator('.datetime-slider__tooltip--arrow')

  await page.mouse.move(0, 0)
  await component.locator('.v-slider-thumb').focus()
  await page.keyboard.press('ArrowRight')
  await expect(label).toBeVisible()
})
