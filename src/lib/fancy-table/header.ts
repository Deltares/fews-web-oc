import { SelectionNoData } from './utils'
import { FancyTable, FancyTableColorConfig } from './table'

export interface DateCellConfig {
  dateString: string
  numCells: number
  firstIndex: number
}

export interface HeaderConfig {
  dates: Date[]
  dateCellConfigs: DateCellConfig[]
}

function getDateCellConfigKey(config: unknown): string {
  return (config as DateCellConfig).dateString
}

export function createHeaderConfig(dates: Date[]): HeaderConfig {
  // Find all unique date strings (so without time) and their start and end
  // cell indices.
  const dateStrings = dates.map((date) => {
    const year = date.getFullYear().toString()
    // Months in JS dates are 0-indexed... :(
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    return `${day}-${month}-${year}`
  })

  // Note that the order of these configurations is not guaranteed when the set
  // is converted to an array. This does not matter for drawing the date
  // cells correctly, because how they are drawn depends on the configuration
  // contents.
  const uniqueDateStrings = Array.from(new Set(dateStrings))
  const dateCellConfigs = uniqueDateStrings.map((dateString) => {
    const firstIndex = dateStrings.indexOf(dateString)
    const lastIndex = dateStrings.lastIndexOf(dateString)
    const numCells = lastIndex - firstIndex + 1
    return { dateString, numCells, firstIndex }
  })

  return { dates, dateCellConfigs }
}

export class FancyTableHeader {
  private config: HeaderConfig
  private colorConfig: FancyTableColorConfig

  private dateGroup: SelectionNoData<SVGGElement>
  private timeGroup: SelectionNoData<SVGGElement>

  private dateBackground: SelectionNoData<SVGRectElement>
  private timeBackground: SelectionNoData<SVGRectElement>

  constructor(
    parent: SelectionNoData<SVGGElement>,
    colorConfig: FancyTableColorConfig,
  ) {
    this.config = {
      dates: [],
      dateCellConfigs: [],
    }
    this.colorConfig = colorConfig

    this.dateGroup = parent.append('g')
    this.timeGroup = parent
      .append('g')
      .attr('transform', `translate(0, ${FancyTable.rowUnitHeight})`)

    this.dateBackground = this.createRowBackground(
      this.dateGroup,
      this.colorConfig.backgroundColorEven,
    )
    this.timeBackground = this.createRowBackground(
      this.timeGroup,
      this.colorConfig.backgroundColorOdd,
    )
  }

  setHeaderConfig(config: HeaderConfig): void {
    this.config = config

    this.updateBackground()

    this.updateDateRow()
    this.updateTimeRow()
  }

  private createRowBackground(
    group: SelectionNoData<SVGGElement>,
    color: string,
  ): SelectionNoData<SVGRectElement> {
    return group
      .append('rect')
      .attr('height', FancyTable.rowUnitHeight)
      .attr('fill', color)
  }

  private updateBackground(): void {
    this.updateRowBackground(this.dateBackground)
    this.updateRowBackground(this.timeBackground)
  }

  private updateRowBackground(
    background: SelectionNoData<SVGRectElement>,
  ): void {
    const rowWidth = this.config.dates.length * FancyTable.cellWidth
    background.attr('width', rowWidth)
  }

  private updateDateRow(): void {
    this.dateGroup
      .selectAll('text')
      .data(this.config.dateCellConfigs, getDateCellConfigKey)
      .join('text')
      .text((d) => d.dateString)
      .attr(
        'x',
        (d) =>
          d.firstIndex * FancyTable.cellWidth + FancyTable.textHorizontalMargin,
      )
      .attr('y', 0.5 * FancyTable.rowUnitHeight)
      .attr('font-size', `${FancyTable.fontSize}`)
      .attr('fill', this.colorConfig.fontColor)
      .attr('text-anchor', 'start')
      .attr('dominant-baseline', 'middle')
  }

  private updateTimeRow(): void {
    this.timeGroup.selectAll('text').remove()

    const textFunc = (date: Date) => {
      const hours = date.getHours().toString().padStart(2, '0')
      const minutes = date.getMinutes().toString().padStart(2, '0')
      return `${hours}:${minutes}`
    }
    this.timeGroup
      .selectAll('text')
      .data(this.config.dates, getDateCellConfigKey)
      .join('text')
      .text(textFunc)
      .attr('x', (_date, index) => (index + 0.5) * FancyTable.cellWidth)
      .attr('y', 0.5 * FancyTable.rowUnitHeight)
      .attr('font-size', `${0.75 * FancyTable.fontSize}`)
      .attr('fill', this.colorConfig.fontColor)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
  }
}

export class FancyTableDateIndicators {
  private parent: SelectionNoData<SVGGElement>
  private colorConfig: FancyTableColorConfig
  private yMax: number

  constructor(
    parent: SelectionNoData<SVGGElement>,
    colorConfig: FancyTableColorConfig,
    yMax: number,
  ) {
    this.parent = parent
    this.colorConfig = colorConfig
    this.yMax = yMax
  }

  setHeaderConfig(config: HeaderConfig): void {
    const xFunc = (config: DateCellConfig) =>
      config.firstIndex * FancyTable.cellWidth
    this.parent
      .selectAll('line')
      // Skip the "boundary" at the start.
      .data(config.dateCellConfigs.slice(1), getDateCellConfigKey)
      .join('line')
      .attr('x1', xFunc)
      .attr('x2', xFunc)
      .attr('y1', 0)
      .attr('y2', this.yMax)
      .attr('stroke', this.colorConfig.dateBoundaryColor)
      .attr('stroke-width', 2)
  }
}
