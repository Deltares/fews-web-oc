import * as d3 from 'd3'

import { FancyTable } from './table'
import { SelectionNoData } from './utils'
import {
  ColoredValueRowConfig,
  DirectionRowConfig,
  DirectionType,
  GraphRowConfig,
} from './types'
import { FancyTableData, FancyTableEvent, getFancyTableEventKey } from './data'
import { FancyTableRow } from './row'

export interface FancyTableRowContent {
  setData(data: FancyTableData | null): void
}

type SeriesSelection<T extends d3.BaseType> = d3.Selection<
  T,
  FancyTableEvent,
  SVGGElement,
  undefined
>
function createSelection<T extends d3.BaseType>(
  parent: SelectionNoData<SVGGElement>,
  tag: string,
): SeriesSelection<T> {
  return parent.selectAll<T, FancyTableEvent>(tag)
}

function updateValueText(
  parent: FancyTableRow,
  events: FancyTableEvent[],
  align: 'middle' | 'bottom' = 'middle',
  customFontColor?: string,
): void {
  // Update the text elements for the new data.
  const textFunc = (event: FancyTableEvent) => event.value ?? '—'
  const xPositionFunc = (_event: FancyTableEvent, index: number) => {
    const xStart = index * FancyTable.cellWidth
    return xStart + FancyTable.cellWidth / 2
  }
  const text = parent.group
    .selectAll('text')
    .data(events, getFancyTableEventKey)
    .join('text')
    .text(textFunc)
    .attr('x', xPositionFunc)
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'middle')
    .attr('font-size', FancyTable.fontSize)

  const defaultFontColor = parent.colorConfig.fontColor
  if (customFontColor) {
    // If we have specified a custom font colour, only use it for cells which
    // have a value. Other cells will not get a colour-mapped background, so
    // the custom font colour will likely look weird.
    const fontColorFunc = (event: FancyTableEvent) =>
      event.value === null ? defaultFontColor : customFontColor
    text.attr('fill', fontColorFunc)
  } else {
    // Just a constant (default) font colour if we have no custom colour.
    text.attr('fill', defaultFontColor)
  }
  if (align === 'middle') {
    text.attr('y', 0.5 * parent.height).attr('dominant-baseline', 'middle')
  } else {
    text
      .attr('y', parent.height - FancyTable.graphVerticalMargin)
      .attr('dominant-baseline', 'auto')
  }
}

export class FancyTableValueContent implements FancyTableRowContent {
  private parent: FancyTableRow

  constructor(parent: FancyTableRow) {
    this.parent = parent
  }

  setData(data: FancyTableData | null): void {
    const events = data?.events ?? []
    updateValueText(this.parent, events)
  }
}

export class FancyTableColoredValueContent implements FancyTableRowContent {
  private parent: FancyTableRow
  private config: ColoredValueRowConfig

  private colorScale: d3.ScaleLinear<string, string>

  constructor(parent: FancyTableRow, config: ColoredValueRowConfig) {
    this.parent = parent
    this.config = config
    this.colorScale = this.createColorScale()
  }

  setData(data: FancyTableData | null): void {
    const events = data?.events ?? []

    const xPositionFunc = (_event: FancyTableEvent, index: number) => {
      return index * FancyTable.cellWidth
    }
    const fillFunc = (event: FancyTableEvent) =>
      event.value !== null ? this.colorScale(event.value) : 'none'
    this.parent.group
      .selectAll('rect')
      .data(events, getFancyTableEventKey)
      .join('rect')
      .attr('x', xPositionFunc)
      .attr('fill', fillFunc)
      .attr('width', FancyTable.cellWidth)
      .attr('height', this.parent.height)

    updateValueText(this.parent, events, 'middle', this.config.fontColor)
  }

  private createColorScale(): d3.ScaleLinear<string, string> {
    const domain = this.config.colorMap.map((entry) => entry.lowerValue)
    const range = this.config.colorMap.map((entry) => entry.color)
    return d3.scaleLinear<string>().domain(domain).range(range).clamp(true)
  }
}

interface LineConfig {
  x1: number
  y1: number
  x2: number
  y2: number
}

export class FancyTableDirectionContent implements FancyTableRowContent {
  private static readonly arrowLength = 0.8
  private static readonly arrowWidth = 2

  private parent: FancyTableRow
  private config: DirectionRowConfig
  private selection: SeriesSelection<SVGLineElement>
  private arrowHeadId: string

  constructor(parent: FancyTableRow, config: DirectionRowConfig) {
    this.parent = parent
    this.config = config

    this.selection = createSelection(parent.group, 'line')
    this.arrowHeadId = this.createArrowHead(parent.group)
  }

  setData(data: FancyTableData | null): void {
    const lines = this.convertSeriesToLineConfig(data)
    this.selection
      .data(lines)
      .join('line')
      .attr('x1', (d) => d.x1)
      .attr('y1', (d) => d.y1)
      .attr('x2', (d) => d.x2)
      .attr('y2', (d) => d.y2)
      .attr('stroke', this.parent.colorConfig.fontColor)
      .attr('stroke-width', FancyTableDirectionContent.arrowWidth)
      .attr('stroke-linecap', 'butt')
      .attr('marker-end', `url(#${this.arrowHeadId})`)
  }

  private createArrowHead(parent: SelectionNoData<SVGGElement>): string {
    const id = crypto.randomUUID()
    const marker = parent
      .append('marker')
      .attr('id', id)
      .attr('viewBox', '0 0 10 10')
      .attr('refX', 8)
      .attr('refY', 5)
      .attr('markerWidth', 4)
      .attr('markerHeight', 4)
      .attr('orient', 'auto-start-reverse')
    marker
      .append('path')
      .attr('d', 'M 0 0 L 10 5 L 0 10 z')
      .attr('fill', this.parent.colorConfig.fontColor)
    return id
  }

  private convertSeriesToLineConfig(data: FancyTableData | null): LineConfig[] {
    if (!data) return []

    const halfLength =
      0.5 *
      FancyTableDirectionContent.arrowLength *
      Math.min(FancyTable.cellWidth, this.parent.height)

    const lines: LineConfig[] = []
    data.events.forEach((event, index) => {
      // Skip events without data; no line element will be added.
      if (event.value === null) return

      // Convert angle from the time series to the appropriate angle depending
      // on the direction type.
      const angle = this.convertToAngle(event.value)

      // Compute start and end position of the arrow w.r.t. (0, 0).
      const x1Relative = -halfLength * Math.cos(angle)
      const y1Relative = halfLength * Math.sin(angle)
      const x2Relative = -x1Relative
      const y2Relative = -y1Relative

      // Compute centre position of the current cell.
      const xCentre = (index + 0.5) * FancyTable.cellWidth
      const yCentre = 0.5 * this.parent.height

      lines.push({
        x1: xCentre + x1Relative,
        x2: xCentre + x2Relative,
        y1: yCentre + y1Relative,
        y2: yCentre + y2Relative,
      })
    })

    return lines
  }

  private convertToAngle(rawValue: number): number {
    let angleDegrees = rawValue
    if (this.config.directionType === DirectionType.Wind) {
      angleDegrees += 180
    } else if (this.config.directionType === DirectionType.Current) {
      angleDegrees += 90
    } else if (this.config.directionType === DirectionType.Wave) {
      angleDegrees += 90
    }
    return (angleDegrees * Math.PI) / 180
  }
}

export class FancyTableGraphContent implements FancyTableRowContent {
  private parent: FancyTableRow
  private config: GraphRowConfig

  private areaPath: SelectionNoData<SVGPathElement> | null
  private linePath: SelectionNoData<SVGPathElement> | null

  constructor(parent: FancyTableRow, config: GraphRowConfig) {
    this.parent = parent
    this.config = config

    const [areaPath, linePath] = this.createPaths()
    this.areaPath = areaPath
    this.linePath = linePath
  }

  setData(data: FancyTableData | null): void {
    const events = data?.events ?? []
    const yScale = this.createYScale(events)

    const xFunc = (_event: FancyTableEvent, index: number) =>
      (index + 0.5) * FancyTable.cellWidth
    const yFunc = (event: FancyTableEvent) => yScale(event.value ?? 0)
    const definedFunc = (event: FancyTableEvent) => event.value !== null
    if (this.config.fill) {
      const areaGenerator = d3
        .area<FancyTableEvent>()
        .x(xFunc)
        .y0(yScale.range()[0])
        .y1(yFunc)
        .defined(definedFunc)
      this.areaPath!.attr('d', areaGenerator(events))
    }
    if (this.config.stroke) {
      const lineGenerator = d3
        .line<FancyTableEvent>()
        .x(xFunc)
        .y(yFunc)
        .defined(definedFunc)
      this.linePath!.attr('d', lineGenerator(events))
    }
    if (this.config.showValues) {
      const relativeHeight = this.config.relativeHeight ?? 1
      const defaultAlign = relativeHeight <= 1 ? 'middle' : 'bottom'
      const align = this.config.alignValues ?? defaultAlign
      updateValueText(this.parent, events, align)
    }
  }

  private createPaths(): [
    SelectionNoData<SVGPathElement> | null,
    SelectionNoData<SVGPathElement> | null,
  ] {
    let areaPath = null
    let linePath = null
    if (this.config.fill) {
      areaPath = this.parent.group
        .append('path')
        .attr('fill', this.config.fill)
        .attr('stroke', 'none')
    }
    if (this.config.stroke) {
      linePath = this.parent.group
        .append('path')
        .attr('fill', 'none')
        .attr('stroke', this.config.stroke)
        .attr('stroke-width', 2)
    }
    return [areaPath, linePath]
  }

  private createYScale(
    events: FancyTableEvent[],
  ): d3.ScaleLinear<number, number> {
    const numValues = events.length
    if (numValues === 0) {
      const emptyYScale = d3.scaleLinear().domain([0, 0]).range([0, 0])
      return emptyYScale
    }

    // Make sure missing values are not taken into account for the domain.
    const values = events
      .map((event) => event.value)
      .filter((y) => y !== null) as number[]

    // Scale the value range from the bottom of the row until some margin from
    // the top. Note that the range is inverted because the SVG y-axis is
    // inverted.
    const yScale = d3
      .scaleLinear()
      .domain(d3.extent(values) as [number, number])
      .range([this.parent.height, FancyTable.graphVerticalMargin])
    return yScale
  }
}
