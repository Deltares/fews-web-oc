import { test, expect } from '@playwright/test'

test.describe('HighlightMatch', () => {
  test('should render with matching text highlighted', async ({ mount }) => {
    const component = await mount('general/HighlightMatch/Default')

    // Check that the component renders
    await expect(component).toContainText('Hello')
    await expect(component).toContainText('World')

    // Verify the matching part is in a bold span
    const boldSpan = component.locator('span.font-weight-bold')
    await expect(boldSpan).toHaveText('World')
  })

  test('should render without query when not provided', async ({ mount }) => {
    const component = await mount('general/HighlightMatch/NoQuery')

    // Should render the full value
    await expect(component).toContainText('Hello World')
  })

  test('should handle partial matches', async ({ mount }) => {
    const component = await mount('general/HighlightMatch/PartialMatch')

    await expect(component).toContainText('The quick brown fox')
    const boldSpan = component.locator('span.font-weight-bold')
    await expect(boldSpan).toHaveText('quick')
  })
})
