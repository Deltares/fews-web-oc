import { test, expect } from '@playwright/test'
import { fileURLToPath } from 'node:url'

for (const theme of ['light', 'dark']) {
  test(`component overrides preserve their appearance in the ${theme} theme`, async ({
    mount,
    page,
  }) => {
    const component = await mount('general/CssOverrides/Default', { theme })
    await page.addStyleTag({ url: '/weboc-default-style.css' })

    await expect(
      component.locator('.v-list-item__prepend > .v-list-item__spacer').first(),
    ).toHaveCSS('width', '12px')
    await expect(
      component.getByRole('button', { name: 'Style test First' }),
    ).toHaveCSS('height', '36px')

    const slider = component.locator('.overlay-panel__gradient-slider')
    await expect(slider.locator('.v-input__control')).toHaveCSS(
      'height',
      '12px',
    )
    await expect(slider.locator('.v-input__control')).toHaveCSS(
      'min-height',
      '12px',
    )
    await expect(slider.locator('.v-slider-track__background')).toHaveCSS(
      'background-image',
      /linear-gradient/,
    )
    await expect(slider.locator('.v-slider-track__fill')).toHaveCSS(
      'opacity',
      '0',
    )

    const textarea = component.locator(
      '.message-textarea textarea:not([readonly])',
    )
    await textarea.focus()
    await expect(textarea).toHaveCSS('outline-style', 'none')
    await expect(textarea).toHaveCSS('mask-image', 'none')
    await expect(component.locator('.message-textarea .v-field')).toHaveCSS(
      'mask-image',
      'none',
    )
    await expect(component.locator('.new-log-card')).toHaveCSS(
      'box-shadow',
      /0px 0px 0px 1px/,
    )

    const chips = component.locator('.v-chip--disabled')
    await expect(chips).toHaveCount(2)
    for (const chip of await chips.all()) {
      await expect(chip).toHaveCSS('opacity', '1')
      await expect(chip).toHaveCSS('pointer-events', 'none')
    }

    await page.addStyleTag({
      path: fileURLToPath(
        new URL(
          '../../node_modules/@deltares/fews-ssd-webcomponent/dist/collection/components/schematic-status-display/schematic-status-display.css',
          import.meta.url,
        ),
      ),
    })
    const ssd = component.locator('schematic-status-display')
    await ssd.evaluate((element) => {
      element.appendChild(
        document.createElementNS('http://www.w3.org/2000/svg', 'svg'),
      )
    })
    await expect(ssd).toHaveCSS('pointer-events', 'auto')
    await expect(ssd.locator('svg')).toHaveCSS('pointer-events', 'auto')
  })

  test(`shared focus outlines remain visible in the ${theme} theme`, async ({
    mount,
    page,
  }) => {
    const component = await mount('general/CssOverrides/Default', { theme })
    await page.addStyleTag({ url: '/weboc-default-style.css' })

    const button = component.getByRole('button', { name: 'Style test First' })
    await button.focus()
    await expect(button).toHaveCSS('outline-width', '1px')
    await expect(button).toHaveCSS('outline-style', 'solid')
    await expect(button).toHaveCSS(
      'outline-color',
      theme === 'light' ? 'rgb(25, 118, 210)' : 'rgb(33, 150, 243)',
    )
  })
}

test('table headers, editable cells, and highlighted borders override Vuetify', async ({
  mount,
  page,
}) => {
  const component = await mount('table/TimeSeriesTable/Benchmark200Rows')
  await page.addStyleTag({ url: '/weboc-default-style.css' })

  const header = component
    .getByRole('columnheader')
    .filter({ hasText: 'Editable series 1' })
  await expect(header).toHaveCSS('padding-top', '20px')
  await expect(header.locator('.table-header-indicator')).toHaveCSS(
    'min-height',
    '24px',
  )

  const firstRow = component.locator('tbody tr[data-row-date]').first()
  await firstRow.locator('td').first().click()
  await expect(firstRow).toHaveClass(/highlighted/)
  await expect(firstRow.locator('td').first()).toHaveCSS(
    'border-left-width',
    '2px',
  )
  await expect(firstRow.locator('td').last()).toHaveCSS(
    'border-right-width',
    '2px',
  )
  await expect(firstRow.locator('td').nth(1)).toHaveCSS(
    'border-bottom-width',
    '2px',
  )

  await header.getByRole('button').click()
  await expect(
    component.locator('td:has(.table-cell-editable)').first(),
  ).toHaveCSS('padding', '0px')
})
