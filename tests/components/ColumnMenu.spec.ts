import { test, expect } from '@playwright/test'
import type { ColumnItem } from './ColumnItem'

test.describe('ColumnMenu', () => {
  test('should render root list with items', async ({ mount }) => {
    const component = await mount('general/ColumnMenu/RootList')
    await expect(component.getByTestId('column-menu--toolbar')).toBeVisible()
    await expect(component.getByTestId('column-menu--toolbar')).toHaveText('')
    // Check that items are visible (window container uses CSS that may hide it)
    await expect(component.getByTestId('column-menu--item')).toHaveText([
      'Item 1',
      'Item 2',
      'Item 3',
    ])
  })

  test('should render Item 1 children', async ({ mount }) => {
    const component = await mount('general/ColumnMenu/WithActive')
    await expect(component.getByTestId('column-menu--toolbar')).toBeVisible()
    await expect(component.getByTestId('column-menu--toolbar')).toHaveText(
      'Item 1',
    )
    // Check that children are visible (window container uses CSS that may hide it)
    await expect(component.getByTestId('column-menu--item')).toHaveText([
      'Item 1.1',
      'Item 1.2',
    ])
  })

  test('should open Item 1', async ({ mount }) => {
    const component = await mount('general/ColumnMenu/Interactive')
    await component.getByText('Item 1').click()
    // Verify that both window items have their content available
    await expect(
      component
        .getByTestId('column-menu--window-item')
        .locator(':scope:first-child')
        .getByTestId('column-menu--item'),
    ).toHaveText(['Item 1', 'Item 2', 'Item 3'])

    await expect(
      component
        .getByTestId('column-menu--window-item')
        .locator(':scope.v-window-item--active')
        .getByTestId('column-menu--item'),
    ).toHaveText(['Item 1.1', 'Item 1.2'])
  })
})
