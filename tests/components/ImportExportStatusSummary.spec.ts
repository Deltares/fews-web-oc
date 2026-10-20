import { test, expect } from '@playwright/test'

test.describe('ImportExportStatusSummary runtime behavior', () => {
  test('emits trimmed taskRunId when the configured log panel supports system logs', async ({
    mount,
  }) => {
    const component = await mount(
      'systemmonitor/ImportExportStatusSummary/LogsEnabled',
    )

    await expect(component.getByLabel('Open logs for task run')).toBeVisible()
    await component.getByLabel('Open logs for task run').click()

    await expect(component.getByTestId('emitted-task-run')).toHaveText(
      'task-run-1',
    )
  })

  test('does not render the log link when only manual logs are configured', async ({
    mount,
  }) => {
    const component = await mount(
      'systemmonitor/ImportExportStatusSummary/ManualOnlyLogs',
    )

    await expect(component.getByLabel('Open logs for task run')).toHaveCount(0)
  })

  test('does not render the log link when the panel is disabled', async ({
    mount,
  }) => {
    const component = await mount(
      'systemmonitor/ImportExportStatusSummary/LogsDisabled',
    )

    await expect(component.getByLabel('Open logs for task run')).toHaveCount(0)
  })

  test('hides optional backend fields when values are not populated', async ({
    mount,
  }) => {
    const component = await mount(
      'systemmonitor/ImportExportStatusSummary/OptionalFieldsMissing',
    )

    await expect(component.getByText('Task run ID')).toHaveCount(0)
    await expect(component.getByText('Workflow ID')).toHaveCount(0)
    await expect(component.getByText('Workflow name')).toHaveCount(0)
    await expect(component.getByText('Status')).toHaveCount(0)
  })
})
