import { test, expect } from '@playwright/test'

test.describe('TableCellEdit', () => {
  test('renders the current value, flag, and comment', async ({ mount }) => {
    const component = await mount('table/TableCellEdit/Default')

    await expect(component.getByPlaceholder('value')).toHaveValue('12')
    await expect(component.locator('select')).toHaveValue('Reliable')
    await expect(component.getByPlaceholder('comment')).toHaveValue(
      'Initial comment',
    )
    await expect(component.locator('select option')).toHaveText([
      'Reliable',
      'Doubtful',
      'Unreliable',
      'Persistent Unreliable',
      'Accumulation Reset',
    ])
  })

  test('emits the edited cell data when a field changes', async ({ mount }) => {
    const component = await mount('table/TableCellEdit/Default')

    await component.getByPlaceholder('value').fill('18.5')
    await expect(component.getByTestId('updated-value')).toContainText(
      '"y":18.5',
    )

    await component.getByPlaceholder('comment').fill('Updated comment')
    await expect(component.getByTestId('updated-value')).toContainText(
      '"comment":"Updated comment"',
    )

    await component.locator('select').selectOption('Doubtful')
    await expect(component.getByTestId('updated-value')).toContainText(
      '"flagEdit":"Doubtful"',
    )
  })
})

test.describe('TableCellEdit in TimeSeriesTable', () => {
  test('renders editors only for the selected editable series and saves edits', async ({
    mount,
  }) => {
    const component = await mount('table/TimeSeriesTable/EditableCell')

    await expect(component.getByPlaceholder('value')).toHaveCount(0)

    const editableHeader = component
      .getByRole('columnheader')
      .filter({ hasText: 'Editable series' })
    await editableHeader.locator('button').click()

    await expect(component.getByPlaceholder('value')).toHaveCount(1)
    await expect(component.getByPlaceholder('value')).toHaveValue('12')
    await expect(component.getByPlaceholder('comment')).toHaveCount(1)
    await expect(
      component.getByRole('columnheader').filter({
        hasText: 'Read-only series',
      }),
    ).not.toContainText('Save')

    await component.getByPlaceholder('value').fill('18.5')
    await component.getByRole('button', { name: 'Save' }).click()

    await expect(component.getByTestId('saved-data')).toContainText(
      '"value":"18.5"',
    )
  })

  test('cancel reuses read-only cells and discards the edited value', async ({
    mount,
  }) => {
    const component = await mount('table/TimeSeriesTable/Benchmark200Rows')
    const readOnlyCell = component.locator('.table-cell-with-flag').first()
    const originalCell = await readOnlyCell.elementHandle()
    const originalValue = await readOnlyCell.locator('.value').textContent()
    const header = component
      .getByRole('columnheader')
      .filter({ hasText: 'Editable series 1' })

    await header.getByRole('button').click()
    await expect(component.getByPlaceholder('value')).toHaveCount(200)
    await expect(readOnlyCell).toBeHidden()
    expect(await originalCell!.evaluate((element) => element.isConnected)).toBe(true)

    await component.getByPlaceholder('value').first().fill('999.5')
    await component.getByPlaceholder('value').first().blur()
    await header.getByRole('button', { name: 'Cancel', exact: true }).click()

    await expect(component.getByPlaceholder('value')).toHaveCount(0)
    await expect(readOnlyCell).toBeVisible()
    await expect(readOnlyCell.locator('.value')).toHaveText(originalValue!)
    expect(await originalCell!.evaluate((element) => element.isConnected)).toBe(true)

    await header.getByRole('button').click()
    await expect(component.getByPlaceholder('value').first()).toHaveValue(
      originalValue!.trim(),
    )
  })

  for (const rowCount of [200, 1000, 2000]) {
    test(`benchmark story renders ${rowCount} rows with five editable series`, async ({
      mount,
      page,
    }) => {
      test.setTimeout(120_000)
      const component = await mount(
        `table/TimeSeriesTable/Benchmark${rowCount}Rows`,
      )

      if (rowCount !== 200) {
        await component.locator('.v-data-table-footer .v-select').click()
        await page
          .getByRole('option', { name: String(rowCount), exact: true })
          .click()
      }

      await expect(component.locator('tbody tr')).toHaveCount(rowCount)
      await expect(component.getByPlaceholder('value')).toHaveCount(0)

      for (let column = 1; column <= 5; column++) {
        await component
          .getByRole('columnheader')
          .filter({ hasText: `Editable series ${column}` })
          .getByRole('button')
          .click()
        await expect(component.getByPlaceholder('value')).toHaveCount(
          rowCount * column,
        )
      }

      await expect(component.getByPlaceholder('comment')).toHaveCount(
        rowCount * 5,
      )
    })
  }
})
