import { test, expect } from '@playwright/test'

for (const viewport of [
  { width: 1920, height: 1080 },
  { width: 390, height: 844 },
]) {
  test(`virtualizes 20,000 locations at ${viewport.width}px`, async ({
    mount,
    page,
  }) => {
    await page.setViewportSize(viewport)
    await mount('dialog/SearchDialog/ManyLocations')

    const list = page.locator('.search-dialog__virtual-scroll')
    const rows = list.locator('[data-search-item-id]')
    await expect(rows.first()).toBeVisible()
    await expect.poll(() => rows.count()).toBeLessThan(100)
    await expect
      .poll(() => list.evaluate((element) => element.clientHeight))
      .toBeLessThan(viewport.height)
    await expect
      .poll(() => list.evaluate((element) => element.scrollHeight))
      .toBeGreaterThan(900_000)

    await list.evaluate((element) => {
      element.scrollTop = element.scrollHeight
    })
    await expect(
      list.locator('[data-search-item-id="station-19999"]'),
    ).toBeVisible()
    await expect.poll(() => rows.count()).toBeLessThan(100)

    const input = page.getByRole('textbox', { name: 'Search', exact: true })
    await input.fill('STATION 19999')
    await expect(rows).toHaveCount(1)
    await expect(rows.first()).toContainText('Station 19999')

    await input.fill('')
    await expect(rows.first()).toHaveAttribute(
      'data-search-item-id',
      'station-0',
    )
    await expect.poll(() => rows.count()).toBeLessThan(100)

    for (let index = 0; index < 40; index++) {
      await input.press('ArrowDown')
    }
    const selected = list.locator('.search-dialog__row--selected')
    await expect(selected).toHaveAttribute('data-search-item-id', 'station-40')
    await expect(selected).toBeInViewport()
    await expect.poll(() => rows.count()).toBeLessThan(100)
  })
}
