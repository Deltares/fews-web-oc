import { test, expect } from '@playwright/test'

test.describe('ImportStatusSummary runtime behavior', () => {
  test('emits trimmed taskRunId when logs are enabled', async ({ mount }) => {
    const component = await mount(
      'systemmonitor/ImportStatusSummary/LogsEnabled',
    )

    await component.getByLabel('Open logs for task run').click()

    await expect(component.getByTestId('emitted-task-run')).toHaveText(
      'task-run-1',
    )
  })

  test('shows tooltip and does not emit when logs are disabled', async ({
    mount,
    page,
  }) => {
    const component = await mount(
      'systemmonitor/ImportStatusSummary/LogsDisabled',
    )

    await component.getByLabel('Open logs for task run').click()
    await expect(page.getByText('Logs not found')).toBeVisible()
    await expect(component.getByTestId('emitted-task-run')).toHaveText('')
  })

  test('toggles and auto-hides logs unavailable tooltip', async ({
    mount,
    page,
  }) => {
    const component = await mount(
      'systemmonitor/ImportStatusSummary/LogsDisabled',
    )
    const tooltip = page.getByText('Logs not found')

    await component.getByLabel('Open logs for task run').click()
    await expect(tooltip).toBeVisible()

    await component.getByLabel('Open logs for task run').click()
    await expect(tooltip).not.toBeVisible()

    await component.getByLabel('Open logs for task run').click()
    await expect(tooltip).toBeVisible()
    await expect(tooltip).not.toBeVisible()
  })

  test('hides optional backend fields when values are not populated', async ({
    mount,
  }) => {
    const component = await mount(
      'systemmonitor/ImportStatusSummary/OptionalFieldsMissing',
    )

    await expect(component.getByText('Task run ID')).toHaveCount(0)
    await expect(component.getByText('Workflow ID')).toHaveCount(0)
    await expect(component.getByText('Workflow name')).toHaveCount(0)
    await expect(component.getByText('Status')).toHaveCount(0)
  })
})
