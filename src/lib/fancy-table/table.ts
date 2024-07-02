import * as d3 from 'd3'

import { Series } from '@/lib/timeseries/timeSeries'

import {
  FancyTableDateIndicators,
  FancyTableHeader,
  createHeaderConfig,
} from './header'
import { TableConfig } from './types'
import { SelectionNoData } from './utils'
import { FancyTableRow } from './row'
import { FancyTableData, gatherUniqueDates, transformTimeSeries } from './data'

export interface FancyTableColorConfig {
  fontColor: string
  backgroundColorOdd: string
  backgroundColorEven: string
  dateBoundaryColor: string
}

const lightColorConfig: Readonly<FancyTableColorConfig> = {
  fontColor: '#000',
  backgroundColorOdd: '#cfd8dc',
  backgroundColorEven: '#eceff1',
  dateBoundaryColor: '#fff',
}
const darkColorConfig: Readonly<FancyTableColorConfig> = {
  fontColor: '#fff',
  backgroundColorOdd: '#37474f',
  backgroundColorEven: '#263238',
  dateBoundaryColor: '#000',
}

export class FancyTable {
  // All lengths specified in pixels.
  public static readonly rowUnitHeight = 40
  public static readonly cellWidth = 40
  public static readonly fontSize = 16
  public static readonly textHorizontalMargin = 6
  public static readonly graphVerticalMargin = 4

  private config: TableConfig
  private viewBoxHeight: number

  private svg: SelectionNoData<SVGSVGElement>

  private headerRowGroup: SelectionNoData<SVGGElement>
  private dateIndicatorsGroup: SelectionNoData<SVGGElement>

  private header: FancyTableHeader
  private rows: FancyTableRow[]
  private dateIndicators: FancyTableDateIndicators

  constructor(
    container: HTMLElement,
    config: TableConfig,
    useDarkTheme: boolean,
  ) {
    this.config = config
    const colorConfig = useDarkTheme ? darkColorConfig : lightColorConfig

    // The view box height is constant for a given configuration, while the
    // width depends on the displayed data.
    this.viewBoxHeight = this.computeViewBoxHeight()

    this.svg = d3.create('svg')

    this.headerRowGroup = this.svg.append('g')
    this.header = new FancyTableHeader(this.headerRowGroup, colorConfig)

    this.rows = this.createContentRows(colorConfig)

    this.dateIndicatorsGroup = this.svg.append('g')
    this.dateIndicators = new FancyTableDateIndicators(
      this.dateIndicatorsGroup,
      colorConfig,
      this.viewBoxHeight,
    )

    // Add the SVG to the DOM; this is necessary so we can resize the labels to
    // the final text width---this is only possible to know for elements in the
    // DOM, unfortunately.
    container.replaceChildren(this.svg.node()!)

    // Initially size the view box for no data and update the label columns to
    // fit their contents exactly.
    this.updateSize()
  }

  node(): SVGSVGElement {
    return this.svg.node()!
  }

  setData(series: Record<string, Series>): void {
    // Transform the time series such that they are all defined (but may have
    // null values) at the same timestamps.
    const dates = this.gatherDates(series)
    const data = this.transformData(series, dates)

    // Update date/time header and date indicator lines.
    const headerConfig = createHeaderConfig(dates)
    this.header.setHeaderConfig(headerConfig)
    this.dateIndicators.setHeaderConfig(headerConfig)

    // Set the appropriate time series data for each row.
    this.rows.forEach((row) => row.setData(data.get(row.requestId) ?? null))

    // Update the table size for the newly added data.
    this.updateSize()
  }

  private gatherDates(series: Record<string, Series>): Date[] {
    // Gather a list of (unique) time series used for this table from the
    // series record.
    const requestIds = Array.from(
      new Set(this.rows.map((row) => row.requestId)),
    )
    const usedSeries = requestIds
      .map((id) => series[id])
      .filter((series) => series !== undefined)
    return gatherUniqueDates(usedSeries)
  }

  private transformData(
    series: Record<string, Series>,
    dates: Date[],
  ): Map<string, FancyTableData> {
    const data = new Map<string, FancyTableData>()
    const requestIds = this.rows.map((row) => row.requestId)
    for (const requestId of requestIds) {
      // Skip if we already have data.
      if (data.has(requestId)) continue

      // Transform each time series into a series that either has a (numeric)
      // value or null for each of the unique dates, such that we have similar
      // time series for all rows.
      data.set(requestId, transformTimeSeries(series[requestId], dates))
    }
    return data
  }

  private updateSize(): void {
    const maxLabelTextWidth = Math.max(
      ...this.rows.map((row) => row.labelTextWidth),
    )

    // Update the label width to fit the contents + margin on both sides.
    const labelWidth = maxLabelTextWidth + 2 * FancyTable.textHorizontalMargin
    this.rows.forEach((row) => row.setLabelWidth(labelWidth))

    // Move the header and date indicators groups to match the label width.
    this.headerRowGroup.attr('transform', `translate(${labelWidth}, 0)`)
    this.dateIndicatorsGroup.attr('transform', `translate(${labelWidth}, 0)`)

    // Set the view box width to the row width; all rows should have the same
    // length, so just use the width of the first row (if it exists).
    const viewBoxWidth = this.rows[0]?.width ?? 0
    this.svg
      .attr('viewBox', `0 0 ${viewBoxWidth} ${this.viewBoxHeight}`)
      .style('width', `${viewBoxWidth}px`)
      .style('height', `${this.viewBoxHeight}px`)
  }

  private createContentRows(
    colorConfig: FancyTableColorConfig,
  ): FancyTableRow[] {
    const dataRowGroup = this.svg.append('g')

    // We start 2 rows down, since we have the date and time rows first.
    let yPosition = 2 * FancyTable.rowUnitHeight
    let isOddRow = false
    const rows = []
    for (const rowConfig of this.config.rows) {
      // Create group for this row.
      const rowGroup: SelectionNoData<SVGGElement> = dataRowGroup
        .append('g')
        .attr('transform', `translate(0, ${yPosition})`)

      // Alternate colours between rows.
      const backgroundColor = isOddRow
        ? colorConfig.backgroundColorOdd
        : colorConfig.backgroundColorEven
      const row = new FancyTableRow(
        rowGroup,
        rowConfig,
        colorConfig,
        backgroundColor,
      )
      rows.push(row)

      // Update y-position and row oddness for the next row.
      yPosition += row.height
      isOddRow = !isOddRow
    }
    return rows
  }

  private computeViewBoxHeight(): number {
    // Compute row height for each row based on its relative height.
    const rowHeights = this.config.rows.map((row) => {
      const relativeHeight = row.relativeHeight ?? 1
      return relativeHeight * FancyTable.rowUnitHeight
    })
    const dataRowsHeight = rowHeights.reduce((sum, height) => sum + height, 0)

    // The date and time rows are 1 unit high each.
    const legendRowsHeight = 2 * FancyTable.rowUnitHeight
    return dataRowsHeight + legendRowsHeight
  }
}
