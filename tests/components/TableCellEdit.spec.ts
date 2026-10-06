import { test, expect } from '@playwright/test'

test.describe('TableCellEdit', () => {
  test('renders the current value, flag, and comment', async ({ mount }) => {
    const component = await mount('table/TableCellEdit/Default')

    await expect(
      component.getByLabel('Value for series-1 at 2025-01-01T00:00:00.000Z'),
    ).toHaveValue('12')
    await expect(
      component.getByLabel(
        'Flag quality for series-1 at 2025-01-01T00:00:00.000Z',
      ),
    ).toHaveValue('Reliable')
    await expect(
      component.getByLabel('Comment for series-1 at 2025-01-01T00:00:00.000Z'),
    ).toHaveValue('Initial comment')
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

  test('shows a visible keyboard focus ring on native fields', async ({
    mount,
  }) => {
    const component = await mount('table/TableCellEdit/Default')
    const valueInput = component.getByLabel(
      'Value for series-1 at 2025-01-01T00:00:00.000Z',
    )
    const flagSelect = component.getByLabel(
      'Flag quality for series-1 at 2025-01-01T00:00:00.000Z',
    )

    await valueInput.focus()
    await expect(valueInput).toHaveCSS('outline-style', 'solid')
    await expect(valueInput).toHaveCSS('outline-width', '2px')
    await expect(valueInput).toHaveCSS('border-radius', '4px')

    await flagSelect.focus()
    await expect(flagSelect).toHaveCSS('outline-style', 'solid')
    await expect(flagSelect).toHaveCSS('outline-width', '2px')
  })
})

test.describe('TableCellEdit in TimeSeriesTable', () => {
  test('shows loaded rows and date range in the status bar', async ({
    mount,
  }) => {
    const component = await mount('table/TimeSeriesTable/EditableCell')
    const status = component.getByTestId('table-status')

    await expect(status).toHaveCSS('height', '40px')
    await expect(status.getByTestId('table-status-row-count')).toHaveText(
      '1 row loaded',
    )
    await expect(status.getByTestId('table-status-row-count')).toHaveCSS(
      'font-size',
      '14px',
    )
    await expect(status.getByTestId('table-status-series-count')).toHaveCount(0)
    const range = status.getByTestId('table-status-date-range').locator('time')
    await expect(range).toHaveCount(2)
    const dateChip = status
      .getByTestId('table-status-date-range')
      .locator('.table-status-bar__date-chip')
    await expect(dateChip).toHaveCount(1)
    await expect
      .poll(async () =>
        dateChip.evaluate((element) => getComputedStyle(element).fontSize),
      )
      .toBe(
        await status
          .getByTestId('table-status-row-count')
          .evaluate((element) => getComputedStyle(element).fontSize),
      )
    await expect(
      status
        .getByTestId('table-status-date-range')
        .locator('.table-status-bar__date-divider'),
    ).toHaveCount(1)
    await expect(
      status
        .getByTestId('table-status-date-range')
        .locator('.table-status-bar__date-divider'),
    ).toHaveCSS('margin-left', '8px')
    await expect(
      status.getByTestId('table-status-date-range'),
    ).not.toContainText('to')
    await expect(range.first()).toHaveAttribute(
      'datetime',
      '2025-01-01T00:00:00.000Z',
    )
    await expect(status.getByTestId('jump-to-first-loaded-row')).toBeVisible()
    await expect(status.getByTestId('jump-to-last-loaded-row')).toBeVisible()
    await expect(
      status.getByTestId('jump-to-first-loaded-row').locator('.mdi-page-first'),
    ).toHaveCount(1)
    await expect(
      status.getByTestId('jump-to-last-loaded-row').locator('.mdi-page-last'),
    ).toHaveCount(1)
    await expect(
      status.getByTestId('jump-to-first-loaded-row').locator('.mdi-page-first'),
    ).toHaveCSS('font-size', '15px')
    await expect(
      status.getByTestId('jump-to-last-loaded-row').locator('.mdi-page-last'),
    ).toHaveCSS('font-size', '15px')
    await expect(dateChip).toHaveCSS('height', '24px')
    await expect(
      status
        .getByTestId('jump-to-last-loaded-row')
        .locator('time + .mdi-page-last'),
    ).toHaveCount(1)
  })

  test('date chips jump to the first and last loaded rows', async ({
    mount,
  }) => {
    const component = await mount('table/TimeSeriesTable/Benchmark200Rows')
    const scrollContainer = component.locator('.v-table__wrapper')
    const firstDate = '2025-01-01T00:00:00.000Z'
    const lastDate = '2025-01-01T03:19:00.000Z'

    await scrollContainer.evaluate((element) => {
      element.scrollTop = 0
    })
    await component.getByTestId('jump-to-first-loaded-row').click()
    await expect(
      component.locator(`tr[data-row-date="${firstDate}"]`),
    ).toBeInViewport()

    await component.getByTestId('jump-to-last-loaded-row').click()
    await expect(
      component.locator(`tr[data-row-date="${lastDate}"]`),
    ).toBeInViewport()
  })

  test('renders editors only for the selected editable series and saves edits', async ({
    mount,
  }) => {
    const component = await mount('table/TimeSeriesTable/EditableCell')
    const statusActivity = component.getByTestId('table-status-activity')

    await expect(component.getByPlaceholder('value')).toHaveCount(0)
    const editableHeader = component
      .getByRole('columnheader')
      .filter({ hasText: 'Editable series' })
    await editableHeader.locator('button').click()

    await expect(component.getByPlaceholder('value')).toHaveCount(1)
    await expect(component.locator('.table-cell-editable').first()).toHaveCSS(
      'z-index',
      'auto',
    )
    await expect(
      component.getByLabel(
        'Value for editable-series at 2025-01-01T00:00:00.000Z',
      ),
    ).toHaveValue('12')
    const editedCell = component.locator('td:has(.table-cell-editable)').first()
    await expect(editedCell).toHaveCSS('padding-left', '0px')
    await expect(editedCell).toHaveCSS('padding-right', '0px')
    await expect(component.getByTestId('table-status-row-count')).toHaveCount(0)
    await expect(statusActivity).toContainText('Tab / Shift+Tab: move fields')
    await expect(statusActivity).toContainText('Enter / Space: select row')
    await expect(statusActivity.locator('kbd')).toHaveText([
      'Tab',
      'Shift',
      'Tab',
      'Enter',
      'Space',
    ])
    const firstKey = statusActivity.locator('kbd').first()
    await expect(firstKey).toHaveCSS('height', '20px')
    await expect(firstKey).toHaveCSS('font-size', '11px')
    const keyCenter = await firstKey.evaluate((element) => {
      const bounds = element.getBoundingClientRect()
      return bounds.top + bounds.height / 2
    })
    const hintCenter = await statusActivity
      .locator('.table-status-bar__keyboard-hint > span')
      .first()
      .evaluate((element) => {
        const bounds = element.getBoundingClientRect()
        return bounds.top + bounds.height / 2
      })
    expect(Math.abs(keyCenter - hintCenter)).toBeLessThan(1)
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
    await expect(component.getByTestId('table-status-row-count')).toHaveText(
      '1 row loaded',
    )
    await expect(statusActivity).not.toContainText('Shift+Tab')
  })

  test('cancel reuses read-only cells and discards the edited value', async ({
    mount,
  }) => {
    const component = await mount('table/TimeSeriesTable/Benchmark200Rows')
    const visibleRows = component.locator('tbody tr:has(td:not([colspan]))')
    const readOnlyCell = component.locator('.table-cell-with-flag').first()
    const originalCell = await readOnlyCell.elementHandle()
    const originalValue = await readOnlyCell.locator('.value').textContent()
    const header = component
      .getByRole('columnheader')
      .filter({ hasText: 'Editable series 1' })

    await header.getByRole('button').click()
    await expect(component.getByPlaceholder('value')).toHaveCount(
      await visibleRows.count(),
    )
    expect(await visibleRows.count()).toBeLessThan(200)
    await expect(readOnlyCell).toBeHidden()
    expect(await originalCell!.evaluate((element) => element.isConnected)).toBe(
      true,
    )

    await component.getByPlaceholder('value').first().fill('999.5')
    await component.getByPlaceholder('value').first().blur()
    await header.getByRole('button', { name: 'Cancel', exact: true }).click()

    await expect(component.getByPlaceholder('value')).toHaveCount(0)
    await expect(readOnlyCell).toBeVisible()
    await expect(readOnlyCell.locator('.value')).toHaveText(originalValue!)
    expect(await originalCell!.evaluate((element) => element.isConnected)).toBe(
      true,
    )

    await header.getByRole('button').click()
    await expect(component.getByPlaceholder('value').first()).toHaveValue(
      originalValue!.trim(),
    )
  })

  test('requests more rows at each virtual table boundary', async ({
    mount,
  }) => {
    const component = await mount('table/TimeSeriesTable/Benchmark200Rows')
    const scrollContainer = component.locator('.v-table__wrapper')

    await expect
      .poll(() => component.locator('tbody tr:has(td:not([colspan]))').count())
      .toBeGreaterThan(0)

    await scrollContainer.evaluate((element: HTMLElement) => {
      element.scrollTop = element.scrollHeight
      element.dispatchEvent(new Event('scroll'))
    })
    await expect(component.getByTestId('load-more-direction')).toHaveText(
      'before',
    )

    await scrollContainer.evaluate((element: HTMLElement) => {
      element.scrollTop = 0
      element.dispatchEvent(new Event('scroll'))
    })
    await expect(component.getByTestId('load-more-direction')).toHaveText(
      'after',
    )
  })

  test('selects and scrolls to the row matching selectedDate', async ({
    mount,
    page,
  }) => {
    const component = await mount('table/TimeSeriesTable/SelectedDateRow')
    const selectedRow = component.locator('tbody tr[aria-selected="true"]')
    const returnToSelectedDate = component.getByTestId(
      'return-to-selected-date',
    )

    await expect(selectedRow).toHaveCount(1)
    await expect(selectedRow.locator('td').first()).toContainText('2:30')
    await expect(selectedRow).toBeInViewport()
    await expect(
      component.getByTestId('table-status-selected-date'),
    ).toContainText('2:30')
    await expect(returnToSelectedDate).toBeHidden()
    const selectedDateJump = component.getByTestId('selected-date-jump')
    await expect(selectedDateJump).toHaveAttribute(
      'aria-label',
      'Back to selected date',
    )

    const statusLabels = [
      component.getByTestId('table-status-row-count'),
      component.getByTestId('table-status-date-range'),
      component.getByTestId('table-status-selected-date'),
    ]
    const initialLabelCenters = await Promise.all(
      statusLabels.map((label) =>
        label.evaluate((element) => {
          const bounds = element.getBoundingClientRect()
          return bounds.top + bounds.height / 2
        }),
      ),
    )

    await component.locator('.v-table__wrapper').evaluate((element) => {
      element.scrollTop = element.scrollHeight
      element.dispatchEvent(new Event('scroll'))
    })
    await selectedDateJump.click()
    await expect(selectedRow).toBeInViewport()

    await component.locator('.v-table__wrapper').evaluate((element) => {
      element.scrollTop = element.scrollHeight
      element.dispatchEvent(new Event('scroll'))
    })
    await expect(returnToSelectedDate).toBeVisible()
    const returnIconSize = await returnToSelectedDate
      .locator('.mdi-arrow-up-right')
      .evaluate((element) => getComputedStyle(element).fontSize)
    await expect(
      component
        .getByTestId('jump-to-first-loaded-row')
        .locator('.mdi-page-first'),
    ).toHaveCSS('font-size', returnIconSize)
    await expect(
      component
        .getByTestId('jump-to-last-loaded-row')
        .locator('.mdi-page-last'),
    ).toHaveCSS('font-size', returnIconSize)
    const visibleButtonLabelCenters = await Promise.all(
      statusLabels.map((label) =>
        label.evaluate((element) => {
          const bounds = element.getBoundingClientRect()
          return bounds.top + bounds.height / 2
        }),
      ),
    )
    visibleButtonLabelCenters.forEach((center, index) => {
      expect(Math.abs(center - initialLabelCenters[index])).toBeLessThan(1)
    })
    await expect(returnToSelectedDate).toHaveAttribute(
      'aria-label',
      'Back to selected date',
    )
    await expect(
      returnToSelectedDate.locator('.mdi-arrow-up-right'),
    ).toHaveCount(1)
    await returnToSelectedDate.hover()
    await expect(
      page.getByRole('tooltip', { name: 'Back to selected date' }),
    ).toHaveText('Back to selected date')
    await returnToSelectedDate.click()

    await expect(selectedRow).toBeInViewport()
    await expect(returnToSelectedDate).toBeHidden()

    await component.locator('.v-table__wrapper').evaluate((element) => {
      element.scrollTop = 0
      element.dispatchEvent(new Event('scroll'))
    })
    await expect(returnToSelectedDate).toBeVisible()
    await expect(
      returnToSelectedDate.locator('.mdi-arrow-down-right'),
    ).toHaveCount(1)
    await returnToSelectedDate.click()
    await expect(selectedRow).toBeInViewport()
  })

  for (const benchmark of [
    {
      name: 'incremental',
      story: 'IncrementalPageLoadBenchmark',
    },
    {
      name: 'full rebuild',
      story: 'FullRebuildPageLoadBenchmark',
    },
  ]) {
    test(`benchmarks repeated page loads with ${benchmark.name}`, async ({
      mount,
      page,
    }) => {
      test.setTimeout(120_000)
      const component = await mount(`table/TimeSeriesTable/${benchmark.story}`)
      const scrollContainer = component.locator('.v-table__wrapper')
      const pageSize = 5_000
      const loadCount = 4
      const latencies: number[] = []

      await expect
        .poll(() =>
          component.locator('tbody tr:has(td:not([colspan]))').count(),
        )
        .toBeGreaterThan(0)

      for (let pageIndex = 1; pageIndex <= loadCount; pageIndex++) {
        const startedAt = await page.evaluate(() => performance.now())
        await scrollContainer.evaluate((element: HTMLElement) => {
          element.scrollTop = 0
          element.dispatchEvent(new Event('scroll'))
        })

        await expect(component.getByTestId('load-more-direction')).toHaveText(
          'after',
        )
        await expect(component.getByTestId('loaded-row-count')).toHaveText(
          String(10_000 + pageIndex * pageSize),
        )
        await expect(component.getByTestId('load-more-count')).toHaveText(
          String(pageIndex),
        )
        await expect
          .poll(() => scrollContainer.evaluate((element) => element.scrollTop))
          .toBeGreaterThanOrEqual(pageSize * 36)
        await expect(component.getByTestId('is-loading-more')).toHaveText(
          'false',
        )

        latencies.push(
          await page.evaluate((start) => performance.now() - start, startedAt),
        )
      }

      const totalLatency = latencies.reduce(
        (total, latency) => total + latency,
        0,
      )
      console.info(
        `[table page-load benchmark] ${benchmark.name}: ${loadCount} pages to ${10 + loadCount * (pageSize / 1_000)}k rows, total ${totalLatency.toFixed(1)}ms, mean ${(totalLatency / loadCount).toFixed(1)}ms, max ${Math.max(...latencies).toFixed(1)}ms`,
      )
    })
  }

  for (const rowCount of [200, 1000, 2000]) {
    test(`benchmark story renders ${rowCount} rows with five editable series`, async ({
      mount,
      page,
    }) => {
      test.setTimeout(120_000)
      const component = await mount(
        `table/TimeSeriesTable/Benchmark${rowCount}Rows`,
      )

      const visibleRows = component.locator('tbody tr:has(td:not([colspan]))')
      await expect.poll(() => visibleRows.count()).toBeGreaterThan(0)
      expect(await visibleRows.count()).toBeLessThan(rowCount)
      await expect(component.getByPlaceholder('value')).toHaveCount(0)

      for (let column = 1; column <= 5; column++) {
        await component
          .getByRole('columnheader')
          .filter({ hasText: `Editable series ${column}` })
          .getByRole('button')
          .click()
        await expect
          .poll(() => component.getByPlaceholder('value').count())
          .toBeGreaterThan(0)
        expect(await component.getByPlaceholder('value').count()).toBeLessThan(
          rowCount * column,
        )
      }

      expect(await component.getByPlaceholder('comment').count()).toBeLessThan(
        rowCount * 5,
      )
    })
  }
})
