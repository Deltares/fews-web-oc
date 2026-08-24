import { test, expect } from '@playwright/experimental-ct-vue'
import ColumnMenu from './ColumnMenu.vue'
import { ColumnItem } from './ColumnItem'

test.use({ viewport: { width: 500, height: 500 } })

const items: ColumnItem[] = [
  {
    id: '1',
    name: 'Item 1',
    children: [
      {
        id: '1.1',
        name: 'Item 1.1',
      },
      {
        id: '1.2',
        name: 'Item 1.2',
      },
    ],
  },
  {
    id: '2',
    name: 'Item 2',
  },
  {
    id: '3',
    name: 'Item 3',
  },
]

test('should render root list with items', async ({ mount }) => {
  const component = await mount(ColumnMenu, { props: { items } })
  await expect(component.getByTestId('column-menu--toolbar')).toBeTruthy()
  await expect(component.getByTestId('column-menu--toolbar')).toHaveText('')
  await expect(component.getByTestId('column-menu--window')).toBeTruthy()
  await expect(component.getByTestId('column-menu--item')).toHaveText([
    'Item 1',
    'Item 2',
    'Item 3',
  ])
})

test('should render Item 1 children', async ({ mount }) => {
  const component = await mount(ColumnMenu, { props: { items, active: '1' } })
  await expect(component.getByTestId('column-menu--toolbar')).toBeTruthy()
  await expect(component.getByTestId('column-menu--toolbar')).toHaveText(
    'Item 1',
  )
  await expect(component.getByTestId('column-menu--window')).toBeTruthy()
  await expect(component.getByTestId('column-menu--item')).toHaveText([
    'Item 1.1',
    'Item 1.2',
  ])
})

test('should open Item 1', async ({ mount, page }) => {
  const component = await mount(ColumnMenu, { props: { items } })
  await component.getByText('Item 1').click()
  await expect(component.getByTestId('column-menu--window')).toBeTruthy()
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
