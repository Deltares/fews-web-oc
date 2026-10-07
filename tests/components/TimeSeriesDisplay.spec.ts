import { test, expect, type Page } from '@playwright/test'

async function mockDisplays(page: Page, count = 30) {
  await page.route('**/topology/actions**', (route) =>
    route.fulfill({
      json: {
        results: Array.from({ length: count }, (_, index) => ({
          requests: [],
          config: {
            timeSeriesDisplay: {
              title: `Display ${index + 1}`,
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
  menu(page).locator('.v-list-item').nth(index - 1)

test.describe('TimeSeriesDisplay selection menu', () => {
  test('clicking a plot changes selection and keeps the menu open', async ({
    mount,
    page,
  }) => {
    await mockDisplays(page)
    const component = await mount('timeseries/TimeSeriesDisplay/SelectionMenu')
    await component.getByRole('button', { name: 'Display 1', exact: true }).click()
    await expect(activeItem(page)).toContainText('Display 1')
    await displayItem(page, 3).click()
    await expect(activeItem(page)).toContainText('Display 3')
    await expect(component.getByRole('button', { name: 'Display 3', exact: true })).toBeVisible()
    await expect(menu(page)).toBeVisible()
  })
})