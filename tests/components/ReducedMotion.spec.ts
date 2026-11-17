import { readFileSync } from 'node:fs'
import { compileStyle, parse } from '@vue/compiler-sfc'
import { expect, test } from '@playwright/test'

const errorCss = readFileSync(
  new URL('../../src/assets/config-error.css', import.meta.url),
  'utf8',
)
const menuFile = new URL(
  '../../src/components/time-control/TimeControlMenu.vue',
  import.meta.url,
)
const { descriptor } = parse(readFileSync(menuFile, 'utf8'))
const scopeId = 'data-v-reduced-motion'
const menuStyle = compileStyle({
  source: descriptor.styles[0].content,
  filename: menuFile.pathname,
  id: scopeId,
  scoped: true,
})
if (menuStyle.errors.length) {
  throw new Error(menuStyle.errors.map(String).join('\n'))
}

for (const reducedMotion of ['no-preference', 'reduce'] as const) {
  test(`startup error page respects ${reducedMotion} motion preferences`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion })
    await page.setContent(`
      <style>${errorCss}</style>
      <div class="error-card">
        <h1>Web OC could not start</h1>
        <a class="retry-btn" href="#retry">Retry</a>
      </div>
    `)

    const reduced = reducedMotion === 'reduce'
    const card = page.locator('.error-card')
    const retry = page.getByRole('link', { name: 'Retry' })
    await expect(card).toHaveCSS(
      'animation-name',
      reduced ? 'none' : 'fade-in-up',
    )
    await expect(retry).toHaveCSS(
      'transition-duration',
      reduced ? '0s' : '0.12s, 0.12s, 0.12s',
    )
    await retry.hover()
    await expect(retry).toHaveCSS(
      'transform',
      reduced ? 'none' : 'matrix(1, 0, 0, 1, 0, -1)',
    )
    await retry.focus()
    await expect(retry).toHaveCSS('outline-style', 'solid')
    await expect(retry).toHaveCSS('outline-width', '3px')
    await expect(card).toBeVisible()
  })

  test(`system-time status respects ${reducedMotion} motion preferences`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion })
    await page.setContent(`
      <style>${menuStyle.code}</style>
      <span ${scopeId} class="systemtime-status systemtime-status--running">
        <span ${scopeId}
          class="systemtime-status__dot systemtime-status__dot--pulse"
          style="animation-duration: 1s; --v-theme-primary: 25, 118, 210"
        ></span>
      </span>
    `)

    const reduced = reducedMotion === 'reduce'
    const dot = page.locator('.systemtime-status__dot')
    await expect(dot).toBeVisible()
    await expect(dot).toHaveCSS(
      'animation-name',
      reduced ? 'none' : /status-blink/,
    )
    const pulse = await dot.evaluate((element) => {
      const style = getComputedStyle(element, '::after')
      return { animationName: style.animationName, content: style.content }
    })
    expect(pulse.animationName).toMatch(reduced ? /^none$/ : /sync-pulse/)
    expect(pulse.content).toBe(reduced ? 'none' : '""')
    if (reduced) {
      await expect(dot).toHaveCSS('opacity', '1')
    }

    await page.emulateMedia({
      reducedMotion: reduced ? 'no-preference' : 'reduce',
    })
    await expect(dot).toHaveCSS(
      'animation-name',
      reduced ? /status-blink/ : 'none',
    )
  })
}
