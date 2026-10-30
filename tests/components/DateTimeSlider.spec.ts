import { test, expect, type Locator } from '@playwright/test'

async function visibleTickLabelBoxes(component: Locator) {
  const labels = component.locator('.v-slider-track__tick-label')
  const boxes = []
  for (const label of await labels.all()) {
    if (await label.isVisible()) boxes.push((await label.boundingBox())!)
  }
  return boxes
}

for (const story of ['ExtraWide', 'Wide', 'Narrow']) {
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

test('shows more date labels on wider sliders', async ({ mount }) => {
  const counts: number[] = []
  for (const story of ['Narrow', 'Wide', 'ExtraWide']) {
    const component = await mount(`general/DateTimeSlider/${story}`)
    await component.locator('.v-slider-track__tick').last().hover()
    counts.push((await visibleTickLabelBoxes(component)).length)
  }
  expect(counts[1]).toBeGreaterThan(counts[0])
  expect(counts[2]).toBeGreaterThan(counts[1])
})

test('prefers day boundaries over hours when labels compete', async ({
  mount,
}) => {
  const component = await mount('general/DateTimeSlider/NarrowFromNoon')

  // The thumb covers the first tick
  await component.locator('.v-slider-track__tick').last().hover()
  const labels = component.locator('.v-slider-track__tick-label')
  await expect(labels.first()).toBeVisible()

  const texts = (await labels.allTextContents()).map((text) => text.trim())
  expect(texts.length).toBeGreaterThan(1)
  // Day labels are dates, hour labels are times
  for (const text of texts) expect(text).not.toContain(':')
})

test('keeps the thumb label visible while dragging off the thumb', async ({
  mount,
}) => {
  const component = await mount('general/DateTimeSlider/Wide')
  const page = component.page()
  const thumb = component.locator('.v-slider-thumb')
  const label = component.locator('.web-oc-slider-chip--arrow-down')

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
  const label = component.locator('.web-oc-slider-chip--arrow-down')

  await page.mouse.move(0, 0)
  await component.locator('.v-slider-thumb').focus()
  await page.keyboard.press('ArrowRight')
  await expect(label).toBeVisible()
})

test('has a white thumb in the dark theme', async ({ mount }) => {
  const component = await mount('general/DateTimeSlider/WideDark')
  await expect(component.locator('.v-slider-thumb__surface')).toHaveCSS(
    'background-color',
    'rgb(255, 255, 255)',
  )
})

// Checks that a circle fits inside a box with rounded corners
function fitsInRoundedBox(
  circle: { x: number; y: number; r: number },
  box: { x: number; y: number; width: number; height: number },
  radius: { top: number; bottom: number },
) {
  const { x, y, r } = circle
  const left = box.x
  const right = box.x + box.width
  const top = box.y
  const bottom = box.y + box.height
  if (x - r < left || x + r > right || y - r < top || y + r > bottom)
    return false
  const corners = [
    { cx: left + radius.top, cy: top + radius.top, R: radius.top },
    { cx: right - radius.top, cy: top + radius.top, R: radius.top },
    { cx: left + radius.bottom, cy: bottom - radius.bottom, R: radius.bottom },
    { cx: right - radius.bottom, cy: bottom - radius.bottom, R: radius.bottom },
  ]
  return corners.every(({ cx, cy, R }) => {
    const inCornerX = cx < left + R + 0.01 ? x < cx : x > cx
    const inCornerY = cy < top + R + 0.01 ? y < cy : y > cy
    if (!inCornerX || !inCornerY) return true
    return Math.hypot(x - cx, y - cy) + r <= R
  })
}

for (const { story, top, bottom } of [
  { story: 'FloatingDesktop', top: 15, bottom: 15 },
  // The bottom corners are those of the phone screen
  { story: 'Phone', top: 0, bottom: 55 },
]) {
  test(`${story}: buttons and thumb stay inside the rounded corners`, async ({
    mount,
  }) => {
    const component = await mount(`general/DateTimeSlider/${story}`)
    const panel = component.getByTestId('floating-panel')
    const box = (await panel.boundingBox())!

    const targets = [
      ...(await panel.locator('.v-btn').all()),
      panel.locator('.v-slider-thumb__surface'),
    ]
    expect(targets.length).toBeGreaterThan(3)
    for (const target of targets) {
      const b = (await target.boundingBox())!
      const circle = {
        x: b.x + b.width / 2,
        y: b.y + b.height / 2,
        r: Math.max(b.width, b.height) / 2,
      }
      expect(
        fitsInRoundedBox(circle, box, { top, bottom }),
        `${await target.evaluate((el) => el.className)} at ${JSON.stringify(circle)}`,
      ).toBe(true)
    }
  })
}
