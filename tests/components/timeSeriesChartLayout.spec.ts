import { expect, test, type Page } from '@playwright/test'

async function mountChartStory(page: Page, story: string) {
  await page.setViewportSize({ width: 1280, height: 1080 })
  await page.goto('/playwright/gallery/index.html')
  await page.waitForFunction(
    () =>
      typeof (window as typeof window & { mount?: unknown }).mount ===
      'function',
  )
  await page.evaluate(async (story) => {
    const gallery = window as typeof window & {
      mount: (params: { story: string }) => Promise<void>
    }
    await gallery.mount({
      story: `components/charts/TimeSeriesChart/${story}`,
    })
  }, story)
  return page.getByTestId('chart-container')
}

for (const { count, story } of [
  { count: 1, story: 'OneChart' },
  { count: 2, story: 'TwoCharts' },
  { count: 3, story: 'ThreeCharts' },
  { count: 4, story: 'FourCharts' },
  { count: 5, story: 'FiveCharts' },
]) {
  test(`renders ${count} mock charts in an 852px container`, async ({ page }) => {
    const fixture = await mountChartStory(page, story)
    await expect(fixture.locator('.chart-with-chips')).toHaveCount(count)
    const svgs = fixture.locator('.chart-container svg')
    await expect(svgs).toHaveCount(count)
    expect(
      await fixture.evaluate((element) => element.getBoundingClientRect().height),
    ).toBe(852)
    const expectedSvgHeight = count === 1 ? 784 : count === 2 ? 358 : 216
    await expect
      .poll(() =>
        svgs.evaluateAll((elements) =>
          elements.map((element) =>
            Math.round(element.getBoundingClientRect().height),
          ),
        ),
      )
      .toEqual(Array(count).fill(expectedSvgHeight))
    await expect
      .poll(() =>
        fixture.evaluate(
          (element) => element.scrollHeight > element.clientHeight,
        ),
      )
      .toBe(count > 3)
  })
}

for (const withBrush of [false, true]) {
  test(`canvas heights follow plot weights 1, 2, 2, 1 in an 861px container${withBrush ? ' with brushes' : ''}`, async ({
    page,
  }) => {
    const fixture = await mountChartStory(
      page,
      withBrush ? 'FourWeightedChartsWithBrush' : 'FourWeightedCharts',
    )
    const brushes = fixture.locator('.brush-container svg')
    await expect(brushes).toHaveCount(withBrush ? 4 : 0)
    if (withBrush) {
      await expect
        .poll(() =>
          brushes.evaluateAll((elements) =>
            elements.map((element) => element.getBoundingClientRect().height),
          ),
        )
        .toEqual([60, 60, 60, 60])
      await expect(fixture.locator('.brush .selection')).toHaveCount(4)
    }
    const canvases = fixture.locator('.chart-container svg .canvas > rect')
    await expect(canvases).toHaveCount(4)
    await expect(fixture.locator('.chart-controls-container')).toHaveCount(4)
    expect(
      await fixture.evaluate((element) => element.getBoundingClientRect().height),
    ).toBe(861)
    await expect
      .poll(async () => {
        const heights = await canvases.evaluateAll((elements) =>
          elements.map((element) => Number(element.getAttribute('height'))),
        )
        const weights = [1, 2, 2, 1]
        return (
          heights[0] > 0 &&
          heights.every(
            (height, index) => Math.abs(height - heights[0] * weights[index]) <= 2,
          )
        )
      })
      .toBe(true)
    await expect
      .poll(() =>
        fixture.evaluate(
          (element) => element.scrollHeight > element.clientHeight,
        ),
      )
      .toBe(false)
  })
}
