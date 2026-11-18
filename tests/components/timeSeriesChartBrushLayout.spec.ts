import { expect, test } from '@playwright/test'

for (const plotWeight of [undefined, 1]) {
  test(`reserves space while the v5 brush loads${plotWeight ? ' with plot weight' : ''}`, async ({
    page,
  }) => {
    let releaseBrush!: () => void
    const brushReady = new Promise<void>((resolve) => {
      releaseBrush = resolve
    })
    await page.route(
      '**/src/components/charts/v5/TimeSeriesChartBrushV5.vue',
      async (route) => {
        await brushReady
        await route.continue()
      },
    )
    try {
      await page.goto('/playwright/gallery/index.html')
      await page.waitForFunction(
        () =>
          typeof (window as typeof window & { mount?: unknown }).mount ===
          'function',
      )
      await page.evaluate(async (plotWeight) => {
        const gallery = window as typeof window & {
          mount: (params: {
            story: string
            props: { engine: string; withBrush: boolean; plotWeight?: number }
          }) => Promise<void>
        }
        await gallery.mount({
          story: 'components/charts/TimeSeriesChart/ThresholdSwitching',
          props: { engine: 'v5', withBrush: true, plotWeight },
        })
      }, plotWeight)
      const placeholder = page.locator('.brush-chart-placeholder')
      const mainChart = page.locator('.chart-v5 > .chart-container')
      await expect(placeholder).toHaveCSS('height', '60px')
      await expect(mainChart.locator('svg')).toBeVisible()
      await expect(placeholder.locator('svg')).toHaveCount(0)
      const initialHeight = await mainChart.evaluate(
        (element) => element.getBoundingClientRect().height,
      )

      releaseBrush()
      await expect(placeholder.locator('svg')).toBeVisible()
      const heights = await mainChart.evaluate(async (element) => {
        const heights: number[] = []
        for (let frame = 0; frame < 5; frame++) {
          await new Promise<void>((resolve) =>
            requestAnimationFrame(() => resolve()),
          )
          heights.push(element.getBoundingClientRect().height)
        }
        return heights
      })
      expect(heights).toEqual(Array(5).fill(initialHeight))
    } finally {
      releaseBrush()
    }
  })
}
