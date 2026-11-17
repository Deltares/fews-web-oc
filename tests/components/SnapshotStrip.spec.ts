import { test, expect, type Locator } from '@playwright/test'

// Zooming changes the interval between frames, and with it the number of
// frames and the scroll width of the strip
async function scrollWidth(viewport: Locator) {
  return viewport.evaluate((el) => el.scrollWidth)
}

test.describe('SnapshotStrip zoom', () => {
  test('shift + vertical wheel zooms', async ({ mount, page }) => {
    const component = await mount('spatialdisplay/SnapshotStrip/Default')
    const viewport = component.locator('.datetime-slider__snapshot-times')
    await viewport.hover()
    const initial = await scrollWidth(viewport)

    await page.keyboard.down('Shift')
    await page.mouse.wheel(0, 100)
    await page.keyboard.up('Shift')
    await expect.poll(() => scrollWidth(viewport)).toBeLessThan(initial)
  })

  test('shift + horizontal wheel zooms, as macOS sends it', async ({
    mount,
    page,
  }) => {
    const component = await mount('spatialdisplay/SnapshotStrip/Default')
    const viewport = component.locator('.datetime-slider__snapshot-times')
    await viewport.hover()
    const initial = await scrollWidth(viewport)

    await page.keyboard.down('Shift')
    await page.mouse.wheel(100, 0)
    await expect.poll(() => scrollWidth(viewport)).toBeLessThan(initial)
    const zoomedOut = await scrollWidth(viewport)

    await page.mouse.wheel(-100, 0)
    await page.keyboard.up('Shift')
    await expect.poll(() => scrollWidth(viewport)).toBeGreaterThan(zoomedOut)
  })

  test('small trackpad deltas add up to one zoom step', async ({
    mount,
    page,
  }) => {
    const component = await mount('spatialdisplay/SnapshotStrip/Default')
    const viewport = component.locator('.datetime-slider__snapshot-times')
    await viewport.hover()
    const initial = await scrollWidth(viewport)

    await page.keyboard.down('Shift')
    await page.mouse.wheel(0, 20)
    await page.waitForTimeout(200)
    expect(await scrollWidth(viewport)).toBe(initial)
    await page.mouse.wheel(0, 20)
    await page.keyboard.up('Shift')
    await expect.poll(() => scrollWidth(viewport)).toBeLessThan(initial)
  })

  test('pinch (ctrl + wheel) zooms the strip, not the page', async ({
    mount,
    page,
  }) => {
    const component = await mount('spatialdisplay/SnapshotStrip/Default')
    const viewport = component.locator('.datetime-slider__snapshot-times')
    await viewport.hover()
    const initial = await scrollWidth(viewport)

    const defaultPrevented = viewport.evaluate(
      (el) =>
        new Promise<boolean>((resolve) =>
          el.addEventListener(
            'wheel',
            (event) => setTimeout(() => resolve(event.defaultPrevented)),
            { once: true },
          ),
        ),
    )
    await page.keyboard.down('Control')
    await page.mouse.wheel(0, 20)
    await page.keyboard.up('Control')

    expect(await defaultPrevented).toBe(true)
    await expect.poll(() => scrollWidth(viewport)).toBeLessThan(initial)
  })

  test('Safari pinch gestures zoom', async ({ mount }) => {
    const component = await mount('spatialdisplay/SnapshotStrip/Default')
    const viewport = component.locator('.datetime-slider__snapshot-times')
    const initial = await scrollWidth(viewport)

    const gesture = (type: string, scale: number) =>
      viewport.evaluate(
        (el, { type, scale }) =>
          el.dispatchEvent(
            Object.assign(new UIEvent(type, { cancelable: true }), { scale }),
          ),
        { type, scale },
      )

    // Pinching in zooms out
    await gesture('gesturestart', 1)
    await gesture('gesturechange', 0.7)
    await expect.poll(() => scrollWidth(viewport)).toBeLessThan(initial)
    const zoomedOut = await scrollWidth(viewport)

    // Spreading the fingers zooms in
    await gesture('gesturestart', 1)
    await gesture('gesturechange', 1.4)
    await expect.poll(() => scrollWidth(viewport)).toBeGreaterThan(zoomedOut)
  })
})
