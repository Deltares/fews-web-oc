import { test, expect, type Page } from '@playwright/test'

async function mockDisplays(
  page: Page,
  count = 30,
  titles: Record<number, string> = {},
) {
  await page.route('**/test-fews/**', (route) =>
    route.fulfill({ json: { permissions: [] } }),
  )
  await page.route('**/topology/actions**', (route) =>
    route.fulfill({
      json: {
        results: Array.from({ length: count }, (_, index) => ({
          requests: [],
          config: {
            timeSeriesDisplay: {
              title: titles[index + 1] ?? `Display ${index + 1}`,
              plotId: `plot-${index + 1}`,
              index,
              subplots: [],
            },
          },
        })),
      },
    }),
  )
}

const menu = (page: Page) => page.locator('.v-menu.v-overlay--active')
const activeItem = (page: Page) => menu(page).locator('.v-list-item--active')
const displayItem = (page: Page, index: number) =>
  menu(page)
    .locator('.v-list-item')
    .nth(index - 1)

async function freezeClock(page: Page) {
  await page.clock.install({ time: new Date('2025-01-01T00:00:00Z') })
  await page.clock.pauseAt(new Date('2025-01-01T00:00:01Z'))
}

test.describe('TimeSeriesDisplay selection menu', () => {
  test('dashboard plots select independently without changing the route and follow chart actions', async ({
    mount,
    page,
  }) => {
    await mockDisplays(page)
    await page.route('**/test-fews/**', (route) => {
      if (route.request().url().includes('/topology/actions')) {
        return route.fallback()
      }
      return route.fulfill({
        json: {
          permissions: [],
          webOCComponentSettings: {
            charts: {
              general: { toolBar: 'true' },
              timeSeriesChart: { enabled: false },
              timeSeriesTable: { enabled: false },
              verticalProfileChart: { enabled: false },
              metaDataPanel: { enabled: false },
              actions: { downloadData: false },
            },
          },
        },
      })
    })
    const component = await mount(
      'timeseries/TimeSeriesDisplay/DashboardSelection',
    )
    const firstChart = component.getByTestId('dashboard-chart-0')
    const secondChart = component.getByTestId('dashboard-chart-1')
    await firstChart
      .getByRole('button', { name: 'Display 1', exact: true })
      .click()
    await displayItem(page, 3).click()
    await expect(
      firstChart.getByRole('button', { name: /^Display 3\b/ }),
    ).toBeVisible()
    await expect(
      secondChart.getByRole('button', { name: 'Display 1', exact: true }),
    ).toBeVisible()
    await page.keyboard.press('Escape')
    await component.update({ actionPlotId: 'plot-8' })
    await expect(
      firstChart.getByRole('button', { name: 'Display 8', exact: true }),
    ).toBeVisible()
    await firstChart
      .getByRole('button', { name: 'Display 8', exact: true })
      .click()
    await displayItem(page, 12).click()
    await expect(
      firstChart.getByRole('button', { name: /^Display 12\b/ }),
    ).toBeVisible()
    await expect(
      secondChart.getByRole('button', { name: 'Display 8', exact: true }),
    ).toBeVisible()
    await expect(component.getByTestId('route-full-path')).toHaveValue(
      '/dashboard?keep=value#selection',
    )
  })

  test('shows keyboard input while typing, deleting, scrolling, and resetting', async ({
    mount,
    page,
  }) => {
    await mockDisplays(page, 120, { 120: 'Zulu river' })
    const component = await mount('timeseries/TimeSeriesDisplay/SelectionMenu')
    await component
      .getByRole('button', { name: 'Display 1', exact: true })
      .click()
    const input = menu(page).getByLabel('Plot selection input')
    await expect(menu(page)).toBeVisible()
    await menu(page).evaluate(async (element) => {
      await Promise.all(
        element
          .getAnimations({ subtree: true })
          .map((animation) => animation.finished),
      )
    })
    await expect(input).toHaveCount(0)
    const list = menu(page).locator('.v-list')
    const listBounds = await list.boundingBox()
    await freezeClock(page)
    await page.keyboard.type('12')
    await expect(input).toHaveText('12')
    await expect(input).toHaveCSS('position', 'absolute')
    await expect(input).toHaveCSS('text-align', 'right')
    const inputBounds = await input.boundingBox()
    expect(inputBounds!.width).toBeLessThan(80)
    expect(inputBounds!.y + inputBounds!.height).toBeLessThan(listBounds!.y)
    expect(inputBounds!.x + inputBounds!.width).toBeCloseTo(
      listBounds!.x + listBounds!.width,
      0,
    )
    expect(await list.boundingBox()).toEqual(listBounds)
    await page.keyboard.type('0')
    await expect(activeItem(page)).toContainText('Zulu river')
    await expect(displayItem(page, 120)).toBeFocused()
    await expect(input).toHaveText('120')
    await expect(input).toBeInViewport()
    await page.keyboard.press('Backspace')
    await expect(input).toHaveText('12')
    await page.clock.runFor(1200)
    await expect(input).toHaveCount(0)
    await page.keyboard.type('Zulu')
    await expect(input).toHaveText('Zulu')
    await page.clock.runFor(220)
    await expect(displayItem(page, 120)).toBeFocused()
    await expect(input).toBeInViewport()
    await page.keyboard.press('Backspace')
    await expect(input).toHaveText('Zul')
    await page.keyboard.press('Escape')
    await page.clock.runFor(300)
    await component
      .getByRole('button', { name: 'Zulu river', exact: true })
      .click()
    await page.clock.runFor(300)
    await expect(input).toHaveCount(0)
    await page.keyboard.type('9')
    await expect(input).toHaveText('9')
    await page.keyboard.press('Backspace')
    await expect(input).toHaveCount(0)
  })

  test('numeric shortcuts move selection, focus, and scroll together', async ({
    mount,
    page,
  }) => {
    await mockDisplays(page)
    const component = await mount('timeseries/TimeSeriesDisplay/SelectionMenu')
    await component
      .getByRole('button', { name: 'Display 1', exact: true })
      .click()
    await expect(menu(page)).toBeVisible()
    await freezeClock(page)
    await page.keyboard.type('12')
    await expect(activeItem(page)).toContainText('Display 12')
    await expect(displayItem(page, 12)).toBeFocused()
    await expect(displayItem(page, 12)).toBeInViewport()
    await expect(
      component.getByRole('button', { name: /^Display 12\b/ }),
    ).toBeVisible()
    await page.clock.runFor(1)
    await expect(component.getByTestId('route-plot-id')).toHaveValue('plot-12')
    await expect(component.getByTestId('route-full-path')).toHaveValue(
      '/series/plot-12?keep=value#selection',
    )
  })

  test('ambiguous numeric prefixes wait 450 ms after the last digit', async ({
    mount,
    page,
  }) => {
    await mockDisplays(page, 120)
    const component = await mount(
      'timeseries/TimeSeriesDisplay/SelectionMenu',
      { plotId: 'plot-5' },
    )
    await component
      .getByRole('button', { name: 'Display 5', exact: true })
      .click()
    await expect(menu(page)).toBeVisible()
    await freezeClock(page)
    await page.keyboard.type('1')
    await page.clock.runFor(300)
    await page.keyboard.type('2')
    await page.clock.runFor(449)
    await expect(activeItem(page)).toContainText('Display 5')
    await page.clock.runFor(1)
    await expect(activeItem(page)).toContainText('Display 12')
    await expect(displayItem(page, 12)).toBeFocused()
  })

  test('a third digit selects immediately and cancels the pending prefix', async ({
    mount,
    page,
  }) => {
    await mockDisplays(page, 120)
    const component = await mount('timeseries/TimeSeriesDisplay/SelectionMenu')
    await component
      .getByRole('button', { name: 'Display 1', exact: true })
      .click()
    await expect(menu(page)).toBeVisible()
    await freezeClock(page)
    await page.keyboard.type('12')
    await page.clock.runFor(100)
    await page.keyboard.type('0')
    await expect(activeItem(page)).toContainText('Display 120')
    await expect(displayItem(page, 120)).toBeFocused()
    await expect(displayItem(page, 120)).toBeInViewport()
    await page.clock.runFor(450)
    await expect(activeItem(page)).toContainText('Display 120')
  })

  test('numeric buffers reset after 1200 ms and invalid indices preserve selection', async ({
    mount,
    page,
  }) => {
    await mockDisplays(page)
    const component = await mount('timeseries/TimeSeriesDisplay/SelectionMenu')
    await component
      .getByRole('button', { name: 'Display 1', exact: true })
      .click()
    await expect(menu(page)).toBeVisible()
    await freezeClock(page)
    await page.keyboard.type('12')
    await expect(activeItem(page)).toContainText('Display 12')
    await page.clock.runFor(1200)
    await page.keyboard.type('9')
    await expect(activeItem(page)).toContainText('Display 9')
    await page.keyboard.type('9')
    await page.clock.runFor(450)
    await expect(activeItem(page)).toContainText('Display 9')
  })

  test('text search prefers prefixes, falls back to substrings, and moves focus', async ({
    mount,
    page,
  }) => {
    await mockDisplays(page, 30, {
      1: 'Alpha river',
      12: 'Middle Zulu gauge',
      30: 'Zulu river',
    })
    const component = await mount('timeseries/TimeSeriesDisplay/SelectionMenu')
    await component
      .getByRole('button', { name: 'Alpha river', exact: true })
      .click()
    await expect(menu(page)).toBeVisible()
    await freezeClock(page)
    await page.keyboard.type('ZULU')
    await page.clock.runFor(219)
    await expect(activeItem(page)).toContainText('Alpha river')
    await page.clock.runFor(1)
    await expect(activeItem(page)).toContainText('Zulu river')
    await expect(displayItem(page, 30)).toBeFocused()
    await expect(displayItem(page, 30)).toBeInViewport()
    await page.clock.runFor(980)
    await page.keyboard.type('gauge')
    await page.clock.runFor(220)
    await expect(activeItem(page)).toContainText('Middle Zulu gauge')
    await expect(displayItem(page, 12)).toBeFocused()
    await page.clock.runFor(980)
    await page.keyboard.type('unmatched')
    await page.clock.runFor(220)
    await expect(activeItem(page)).toContainText('Middle Zulu gauge')
  })

  test('Backspace revises numeric and text buffers', async ({
    mount,
    page,
  }) => {
    await mockDisplays(page, 30, { 1: 'Alpha river', 3: 'Zulu river' })
    const component = await mount('timeseries/TimeSeriesDisplay/SelectionMenu')
    await component
      .getByRole('button', { name: 'Alpha river', exact: true })
      .click()
    await expect(menu(page)).toBeVisible()
    await freezeClock(page)
    await page.keyboard.type('12')
    await expect(activeItem(page)).toContainText('Display 12')
    await page.keyboard.press('Backspace')
    await page.clock.runFor(450)
    await expect(activeItem(page)).toContainText('Alpha river')
    await page.clock.runFor(750)
    await page.keyboard.type('Zulux')
    await page.clock.runFor(220)
    await expect(activeItem(page)).toContainText('Alpha river')
    await page.keyboard.press('Backspace')
    await page.clock.runFor(220)
    await expect(activeItem(page)).toContainText('Zulu river')
    await expect(displayItem(page, 3)).toBeFocused()
  })

  test('Escape cancels pending selection and clears buffers when reopening', async ({
    mount,
    page,
  }) => {
    await mockDisplays(page)
    const component = await mount('timeseries/TimeSeriesDisplay/SelectionMenu')
    const button = component.getByRole('button', { name: /^Display 1\b/ })
    await button.click()
    await expect(menu(page)).toBeVisible()
    await freezeClock(page)
    await page.keyboard.type('2')
    await page.keyboard.press('Escape')
    await page.clock.runFor(1200)
    await expect(menu(page)).toHaveCount(0)
    await expect(button).toBeFocused()
    await button.click()
    await page.clock.runFor(300)
    await page.keyboard.type('3')
    await page.clock.runFor(450)
    await expect(activeItem(page)).toContainText('Display 3')
    await expect(displayItem(page, 3)).toBeFocused()
  })

  test('modified keys and keys pressed while closed do not change selection', async ({
    mount,
    page,
  }) => {
    await mockDisplays(page)
    const component = await mount('timeseries/TimeSeriesDisplay/SelectionMenu')
    const button = component.getByRole('button', { name: /^Display 1\b/ })
    await button.click()
    await expect(menu(page)).toBeVisible()
    await freezeClock(page)
    for (const modifier of ['Control', 'Meta', 'Alt']) {
      await page.keyboard.press(`${modifier}+2`)
    }
    await page.clock.runFor(450)
    await expect(activeItem(page)).toContainText('Display 1')
    await page.keyboard.press('Escape')
    await page.clock.runFor(300)
    await page.keyboard.type('12')
    await page.clock.runFor(450)
    await expect(button).toBeVisible()
    await button.click()
    await page.clock.runFor(300)
    await expect(activeItem(page)).toContainText('Display 1')
  })

  test('changing plotId props updates the active item without closing the menu', async ({
    mount,
    page,
  }) => {
    await mockDisplays(page)
    const component = await mount(
      'timeseries/TimeSeriesDisplay/SelectionMenu',
      { plotId: 'plot-3' },
    )
    await component
      .getByRole('button', { name: 'Display 3', exact: true })
      .click()
    await expect(activeItem(page)).toContainText('Display 3')
    await component.update({ plotId: 'plot-25' })
    await expect(activeItem(page)).toContainText('Display 25')
    await expect(displayItem(page, 25)).toBeFocused()
    await expect(displayItem(page, 25)).toBeInViewport()
    await expect(menu(page)).toBeVisible()
  })

  test('clicking a plot changes selection and keeps the menu open', async ({
    mount,
    page,
  }) => {
    await mockDisplays(page)
    const component = await mount('timeseries/TimeSeriesDisplay/SelectionMenu')
    await component
      .getByRole('button', { name: 'Display 1', exact: true })
      .click()
    await expect(activeItem(page)).toContainText('Display 1')
    await displayItem(page, 3).click()
    await expect(activeItem(page)).toContainText('Display 3')
    await expect(
      component.getByRole('button', { name: /^Display 3\b/ }),
    ).toBeVisible()
    await expect(menu(page)).toBeVisible()
    await expect(component.getByTestId('route-plot-id')).toHaveValue('plot-3')
  })

  test('restores plot selection from the route and follows route changes', async ({
    mount,
    page,
  }) => {
    await mockDisplays(page)
    const component = await mount(
      'timeseries/TimeSeriesDisplay/SelectionMenu',
      { routePlotId: 'plot-25' },
    )
    await expect(component.getByTestId('route-full-path')).toHaveValue(
      '/series/plot-25?keep=value#selection',
    )
    await component
      .getByRole('button', { name: 'Display 25', exact: true })
      .click()
    await expect(activeItem(page)).toContainText('Display 25')
    await menu(page).evaluate(async (element) => {
      await Promise.all(
        element
          .getAnimations({ subtree: true })
          .map((animation) => animation.finished),
      )
    })
    await expect(displayItem(page, 25)).toBeFocused()
    await component.update({ routePlotId: 'plot-8' })
    await expect(activeItem(page)).toContainText('Display 8')
    await expect(displayItem(page, 8)).toBeFocused()
    await expect(component.getByTestId('route-full-path')).toHaveValue(
      '/series/plot-8?keep=value#selection',
    )
    await component.update({ routePlotId: undefined })
    await expect(activeItem(page)).toContainText('Display 1')
    await expect(component.getByTestId('route-plot-id')).toHaveValue('plot-1')
  })

  test('external plot and node changes cancel pending keyboard selections', async ({
    mount,
    page,
  }) => {
    await mockDisplays(page, 30, { 30: 'Zulu river' })
    const component = await mount(
      'timeseries/TimeSeriesDisplay/SelectionMenu',
      { plotId: 'plot-5' },
    )
    await component
      .getByRole('button', { name: 'Display 5', exact: true })
      .click()
    await expect(menu(page)).toBeVisible()
    await freezeClock(page)
    const input = menu(page).getByLabel('Plot selection input')

    await page.keyboard.type('1')
    await expect(input).toHaveText('1')
    await component.update({ plotId: 'plot-8' })
    await expect(activeItem(page)).toContainText('Display 8')
    await expect(input).toHaveCount(0)
    await page.clock.runFor(1200)
    await expect(activeItem(page)).toContainText('Display 8')

    await page.keyboard.type('Zulu')
    await expect(input).toHaveText('Zulu')
    await component.update({ plotId: 'plot-25' })
    await expect(activeItem(page)).toContainText('Display 25')
    await expect(input).toHaveCount(0)
    await page.clock.runFor(1200)
    await expect(activeItem(page)).toContainText('Display 25')

    await page.keyboard.type('1')
    await expect(input).toHaveText('1')
    await component.update({ nodeId: 'other-node', plotId: 'plot-25' })
    await expect(input).toHaveCount(0)
    await page.clock.runFor(1200)
    await expect(activeItem(page)).toContainText('Display 25')
  })

  test('retains the incoming plot during a node switch until the new displays arrive', async ({
    mount,
    page,
  }) => {
    await mockDisplays(page)
    let releaseResponse!: () => void
    const responseReady = new Promise<void>((resolve) => {
      releaseResponse = resolve
    })
    let newNodeRequests = 0
    await page.route('**/topology/actions**', async (route) => {
      if (!route.request().url().includes('new-node')) return route.fallback()
      newNodeRequests += 1
      await responseReady
      await route.fulfill({
        json: {
          results: ['new-first', 'new-selected'].map((plotId, index) => ({
            requests: [],
            config: {
              timeSeriesDisplay: {
                title: plotId,
                plotId,
                index,
                subplots: [],
              },
            },
          })),
        },
      })
    })
    const component = await mount(
      'timeseries/TimeSeriesDisplay/SelectionMenu',
      { plotId: 'plot-2' },
    )
    await expect(
      component.getByRole('button', { name: 'Display 2', exact: true }),
    ).toBeVisible()
    const navigationCount = component.getByTestId('navigation-count')
    const initialCount = await navigationCount.inputValue()
    try {
      await component.update({ nodeId: 'new-node', plotId: 'new-selected' })
      await expect.poll(() => newNodeRequests).toBeGreaterThan(0)
      await expect(navigationCount).toHaveValue(initialCount)
    } finally {
      releaseResponse()
    }
    await expect(
      component.getByRole('button', { name: 'new-selected', exact: true }),
    ).toBeVisible()
    await expect(navigationCount).toHaveValue(initialCount)
  })

  test('canonicalizes invalid and missing route params when the fallback is already selected', async ({
    mount,
    page,
  }) => {
    await mockDisplays(page)
    const component = await mount(
      'timeseries/TimeSeriesDisplay/SelectionMenu',
      { routePlotId: 'plot-1' },
    )
    await expect(
      component.getByRole('button', { name: 'Display 1', exact: true }),
    ).toBeVisible()
    const navigationCount = component.getByTestId('navigation-count')
    const initialCount = Number(await navigationCount.inputValue())
    await component.update({ routePlotId: 'plot-99' })
    await expect(navigationCount).toHaveValue(String(initialCount + 1))
    await expect(component.getByTestId('route-full-path')).toHaveValue(
      '/series/plot-1?keep=value#selection',
    )
    await component.update({ routePlotId: undefined })
    await expect(navigationCount).toHaveValue(String(initialCount + 2))
    await expect(component.getByTestId('route-full-path')).toHaveValue(
      '/series/plot-1?keep=value#selection',
    )
  })

  test('falls back to the first plot when the route contains an unknown plotId', async ({
    mount,
    page,
  }) => {
    await mockDisplays(page)
    const component = await mount(
      'timeseries/TimeSeriesDisplay/SelectionMenu',
      { routePlotId: 'plot-99' },
    )
    await expect(
      component.getByRole('button', { name: 'Display 1', exact: true }),
    ).toBeVisible()
    await expect(component.getByTestId('route-plot-id')).toHaveValue('plot-1')
  })
})
