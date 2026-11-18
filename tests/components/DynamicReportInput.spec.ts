import { expect, test } from '@playwright/test'

test('edits a report input in the editor and restores it on undo', async ({
  mount,
}) => {
  const component = await mount('reports/dynamic/DynamicReportInput/Editable')
  const input = component.getByLabel('Value at 2026-10-27T06:00:00Z')

  await expect(input).toHaveValue('12.3')
  await input.fill('42')
  await expect(component.getByTestId('editor-html')).toContainText('>42</span>')
  await component.getByRole('button', { name: 'Undo' }).click()
  await expect(input).toHaveValue('12.3')
  await expect(component.getByTestId('editor-html')).toContainText(
    '>12.3</span>',
  )
})
