import { readFileSync } from 'node:fs'
import { compileStyle, parse } from '@vue/compiler-sfc'
import { expect, test } from '@playwright/test'

for (const scenario of [
  {
    component: 'SelectIcon',
    className: 'select-icon',
    activeClass: 'active',
  },
  {
    component: 'GroupSelect',
    className: 'menu-icon',
    activeClass: 'active-menu-icon',
  },
]) {
  const file = new URL(
    `../../src/components/general/${scenario.component}.vue`,
    import.meta.url,
  )
  const { descriptor } = parse(readFileSync(file, 'utf8'))
  const scopeId = 'data-v-icon-transitions'
  const style = compileStyle({
    source: descriptor.styles[0].content,
    filename: file.pathname,
    id: scopeId,
    scoped: true,
  })
  if (style.errors.length) {
    throw new Error(style.errors.map(String).join('\n'))
  }

  test(`${scenario.component} transitions only its rotation`, async ({
    page,
  }) => {
    await page.setContent(`
      <style>${style.code}</style>
      <span ${scopeId} class="${scenario.className}"
        style="display: inline-block; opacity: 1">Chevron</span>
    `)
    const icon = page.locator(`.${scenario.className}`)
    await expect(icon).toHaveCSS('transition-property', 'transform')
    await expect(icon).toHaveCSS('transition-duration', '0.2s')
    await expect(icon).toHaveCSS(
      'transition-timing-function',
      'cubic-bezier(0.4, 0, 0.2, 1)',
    )
    await expect(icon).toHaveCSS('transform', 'none')

    await icon.evaluate((element, activeClass) => {
      element.classList.add(activeClass)
      element.style.opacity = '0.5'
    }, scenario.activeClass)
    await expect(icon).toHaveCSS('opacity', '0.5')
    await expect(icon).toHaveCSS('transform', 'matrix(-1, 0, 0, -1, 0, 0)')

    await icon.evaluate((element, activeClass) => {
      element.classList.remove(activeClass)
    }, scenario.activeClass)
    await expect(icon).toHaveCSS('transform', 'none')
  })
}
