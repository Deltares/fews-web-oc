import { test, expect } from '@playwright/test'

test('renders both profiles and legends when the first profile reverses x direction', async ({
  mount,
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  const component = await mount('charts/v5/TimeSeriesChartV5/SharedElevation', {
    dataReady: false,
    reversingProfile: true,
  })
  const charts = component.locator('.chart-v5')
  await expect(charts).toHaveCount(2)
  for (let update = 0; update < 2; update++) {
    await component.update({ dataReady: true, reversingProfile: true })
    for (const chart of await charts.all()) {
      await expect(
        chart.getByRole('button', { name: 'Profile', exact: true }),
      ).toBeVisible()
      const path = chart.locator('.chart-container svg path[data-mark="line"]')
      await expect(path).toHaveAttribute('d', /^M.+L/)
      await expect(path).not.toHaveAttribute('d', /NaN|Infinity/)
    }
    if (update === 0) {
      await component.update({ dataReady: false, reversingProfile: true })
      await expect(
        charts.getByRole('button', { name: 'Profile', exact: true }),
      ).toHaveCount(0)
    }
  }
  expect(errors).toEqual([])
})

test('shares elevation mouseover, zoom, pan and reset between profiles', async ({
  mount,
  page,
}) => {
  const component = await mount('charts/v5/TimeSeriesChartV5/SharedElevation')
  const charts = component.locator('.chart-v5')
  const labels = charts.locator('[data-crosshair-label="y"] text')
  const yAxes = charts.locator('[data-crosshair-axis="y"]')
  await expect(charts).toHaveCount(2)
  const first = charts.first().locator('.chart-container > svg')
  const second = charts.nth(1).locator('.chart-container > svg')
  await expect(first).toBeVisible()
  await expect(second).toBeVisible()

  const box = await first.boundingBox()
  if (!box) throw new Error('Missing profile bounds')
  const x = box.x + box.width / 2
  const y = box.y + box.height / 2
  await page.mouse.move(x - 80, y)
  await expect(labels).toHaveCount(2)
  await expect(labels.first()).toBeVisible()
  await expect(labels.nth(1)).toBeVisible()
  await expect(labels.nth(1)).toHaveText((await labels.allTextContents())[0])
  await expect(yAxes.first()).toHaveAttribute('display', '')
  await expect(yAxes.nth(1)).toHaveAttribute('display', '')
  await expect(
    page.getByRole('tooltip').filter({ hasText: 'Profile' }),
  ).toHaveText('Profile · 2 degC')

  const secondBox = await second.boundingBox()
  if (!secondBox) throw new Error('Missing second profile bounds')
  await page.mouse.move(
    secondBox.x + secondBox.width / 2 - 80,
    secondBox.y + secondBox.height / 2,
  )
  await expect(labels.first()).toHaveText((await labels.allTextContents())[1])
  await expect(
    page.getByRole('tooltip').filter({ hasText: 'Profile' }),
  ).toHaveText('Profile · 12 degC')

  const ticks = (chart: typeof first) =>
    chart.locator('[data-scale="y0"] [data-axis-ticks] text')
  await expect(ticks(first)).not.toHaveCount(0)
  const initialTicks = await ticks(first).allTextContents()
  await expect(ticks(second)).toHaveText(initialTicks)

  await page.mouse.move(x - 30, y - 70)
  await page.mouse.down()
  await page.mouse.move(x + 30, y + 70, { steps: 10 })
  await page.mouse.up()
  await expect(ticks(first)).not.toHaveText(initialTicks)
  const zoomedTicks = await ticks(first).allTextContents()
  await expect(ticks(second)).toHaveText(zoomedTicks)

  await page.mouse.move(x, y)
  await page.keyboard.down('Shift')
  await page.mouse.down()
  await page.mouse.move(x, y + 30, { steps: 10 })
  await page.mouse.up()
  await page.keyboard.up('Shift')
  await expect(ticks(first)).not.toHaveText(zoomedTicks)
  await expect(ticks(second)).toHaveText(await ticks(first).allTextContents())

  await page.mouse.dblclick(x, y)
  await expect(ticks(first)).toHaveText(initialTicks)
  await expect(ticks(second)).toHaveText(initialTicks)

  await page.mouse.move(0, 0)
  await expect(charts.locator('[data-layer="crosshair"]').first()).toBeHidden()
  await expect(charts.locator('[data-layer="crosshair"]').nth(1)).toBeHidden()
})
