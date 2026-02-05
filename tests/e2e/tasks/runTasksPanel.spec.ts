import { test, expect, type Page } from '@playwright/test'
import { describeFromVersion } from '../utils/versionedTest'

const base = '/topology/early_warning/node'

async function openTasksPanel(page: Page) {
  const moreOptionsBtn = page.getByRole('button', {
    name: 'More Sidepanel Options',
  })
  await moreOptionsBtn.click()
  const runTasksItem = page
    .getByRole('listitem')
    .filter({ hasText: 'Run Tasks' })
  await runTasksItem.click()
}

describeFromVersion('202402', 'Run Tasks Panel', () => {
  test('should open Run Tasks panel, verify scenario, default values, coordinates, and toggle selector', async ({
    page,
  }) => {
    await page.goto(
      `${base}/viewer_rivers_palmiet/viewer_rivers_palmiet_scenario/map/waterdepth_sfincs_palmiet`,
    )

    await openTasksPanel(page)

    const sidePanel = page.getByLabel('Side panel')
    await expect(sidePanel).toContainText('SFINCS Palmiet scenario')

    // Check default input values
    const precipitationScale = page.getByRole('textbox', {
      name: 'Precipitation scale factor*',
    })
    const precipitationOffset = page.getByRole('textbox', {
      name: 'Precipitation offset [mm/hr',
    })
    await expect(precipitationScale).toHaveValue('1')
    await expect(precipitationOffset).toHaveValue('0')

    // Switch scenario
    const scenarioCombo = page
      .getByRole('combobox')
      .filter({ hasText: 'Select what-if scenario' })
    await scenarioCombo.click()
    const scenarioMap = page.getByRole('option', {
      name: 'SFINCS Palmiet scenario map',
    })
    await scenarioMap.click()

    // Check coordinate values
    const latitude = page.getByRole('textbox', {
      name: 'Latitude [degrees]',
    })
    const longitude = page.getByRole('textbox', {
      name: 'Longitude [degrees]',
    })
    const coordinate = page.getByRole('textbox', {
      name: 'Coordinate',
    })
    await expect(latitude).toHaveValue('-29.83')
    await expect(longitude).toHaveValue('31.06')
    await expect(coordinate).toHaveValue('-29.83000°N 31.06000°E')

    // Toggle coordinate selector control visibility
    const coordSelector = page.getByLabel('Coordinate Selector Control')
    const selectCoordBtn = page.getByRole('button', {
      name: 'Select coordinate on map',
    })

    await expect(coordSelector).not.toBeVisible()

    // Open coordinate selector
    await selectCoordBtn.click()
    await expect(coordSelector).toBeVisible()
    const coordSelectorDiv = coordSelector.locator('div[role="status"]', {
      name: 'Selected coordinates',
    })
    await expect(coordSelectorDiv).toContainText('-29.83000°N31.06000°E')

    // Close coordinate selector
    const coordSelectorCloseBtn = coordSelector.getByRole('button')
    await coordSelectorCloseBtn.click()
    await expect(coordSelector).not.toBeVisible()
  })

  test('should open Run Tasks panel, verify regrid task, default values, coordinates, and toggle selector', async ({
    page,
  }) => {
    await page.goto(
      `${base}/viewer_meteorology_rainfall_forecast/viewer_global_precipitation_forecast_global/map/tot_prec_gfs`,
    )

    await openTasksPanel(page)

    const sidePanel = page.getByLabel('Side panel')
    await expect(sidePanel).toContainText('Regrid precipitation')

    // Check default input values
    const boundingBox = page.getByRole('textbox', {
      name: 'Bounding box',
    })
    const lonMin = page.getByRole('textbox', {
      name: 'Minimum longitude [degrees]*',
    })
    const lonMax = page.getByRole('textbox', {
      name: 'Maximum longitude [degrees]*',
    })
    const latMin = page.getByRole('textbox', {
      name: 'Minimum latitude [degrees]*',
    })
    const latMax = page.getByRole('textbox', {
      name: 'Maximum latitude [degrees]*',
    })
    const xCellSize = page.getByRole('textbox', {
      name: 'X cell size [degrees]*',
    })
    const yCellSize = page.getByRole('textbox', {
      name: 'Y cell size [degrees]*',
    })
    await expect(boundingBox).toHaveValue('25°E -33°N, 38°E -25°N')
    await expect(lonMin).toHaveValue('25.00')
    await expect(lonMax).toHaveValue('38.00')
    await expect(latMin).toHaveValue('-33.00')
    await expect(latMax).toHaveValue('-25.00')
    await expect(xCellSize).toHaveValue('0.50')
    await expect(yCellSize).toHaveValue('0.50')

    const timeZero = page.getByRole('textbox', {
      name: 'Time zero',
    })
    await expect(timeZero).toBeVisible()

    // Toggle bounding box selector control visibility
    const bboxSelector = page.getByLabel('Bounding Box Control')
    const drawBboxBtn = page.getByRole('button', {
      name: 'Draw bounding box on map',
    })

    await expect(bboxSelector).not.toBeVisible()

    // Open bounding box selector
    await drawBboxBtn.click()
    await expect(bboxSelector).toBeVisible()
    const bboxSelectorDiv = bboxSelector.getByRole('status', {
      name: 'Selected bounding box coordinates',
    })
    await expect(bboxSelectorDiv).toContainText('25°E -33°N, 38°E -25°N')

    // Close bounding box selector
    const bboxSelectorCloseBtn = bboxSelector.getByRole('button')
    await bboxSelectorCloseBtn.click()
    await expect(bboxSelector).not.toBeVisible()
  })

  test('should open Run Tasks panel, verify particle tracking task, default values, coordinates, hideT0', async ({
    page,
  }) => {
    await page.goto(
      `${base}/viewer_coastal_particle_tracking/viewer_coastal_particle_tracking_d3d/map/part`,
    )

    await openTasksPanel(page)

    const sidePanel = page.getByLabel('Side panel')
    await expect(sidePanel).toContainText('Particle tracking')

    // Check coordinate values
    const latitude = page.getByRole('textbox', {
      name: 'Latitude [degrees]',
    })
    const longitude = page.getByRole('textbox', {
      name: 'Longitude [degrees]',
    })
    const coordinate = page.getByRole('textbox', {
      name: 'Coordinate',
    })
    await expect(latitude).toHaveValue('-29.83')
    await expect(longitude).toHaveValue('31.06')
    await expect(coordinate).toHaveValue('-29.83000°N 31.06000°E')

    // Check default input values
    const radiusBox = page.getByRole('textbox', {
      name: 'Radius [degrees]*',
    })
    const nrParticlesBox = page.getByRole('textbox', {
      name: 'Nr. of particles*',
    })
    const totalMassBox = page.getByRole('textbox', {
      name: 'Total mass [kilogram]*',
    })
    const simulationPeriodBox = page.getByRole('textbox', {
      name: 'Simulation period [seconds]*',
    })

    await expect(radiusBox).toHaveValue('0.01')
    await expect(nrParticlesBox).toHaveValue('10')
    await expect(totalMassBox).toHaveValue('30')
    await expect(simulationPeriodBox).toHaveValue('86400')

    const timeZero = page.getByRole('textbox', {
      name: 'Time zero',
    })
    await expect(timeZero).not.toBeVisible()
  })
})
