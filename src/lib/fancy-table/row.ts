import { FancyTable, FancyTableColorConfig } from './table'
import { RowConfig, RowType } from './types'
import { SelectionNoData } from './utils'
import {
  FancyTableColoredValueContent,
  FancyTableDirectionContent,
  FancyTableGraphContent,
  FancyTableRowContent,
  FancyTableValueContent,
} from './content'
import { FancyTableData } from './data'

export class FancyTableRow {
  config: RowConfig
  _colorConfig: FancyTableColorConfig
  data: FancyTableData | null

  labelWidth: number
  backgroundElement: SelectionNoData<SVGRectElement>
  labelElement: SelectionNoData<SVGTextElement>

  contentGroup: SelectionNoData<SVGGElement>
  content: FancyTableRowContent

  constructor(
    parent: SelectionNoData<SVGGElement>,
    config: RowConfig,
    colorConfig: FancyTableColorConfig,
    backgroundColor: string,
  ) {
    this.config = config
    this._colorConfig = colorConfig
    this.data = null

    // Initial guess for the label width, will be corrected once all labels have
    // been updated.
    this.labelWidth = 200
    this.backgroundElement = this.createBackground(parent, backgroundColor)
    this.labelElement = this.createLabel(parent)

    // Create empty row contents, this will be filled once data will be set.
    this.contentGroup = this.createContentGroup(parent)
    this.content = this.createContent()
  }

  get height(): number {
    const relativeHeight = this.config.relativeHeight ?? 1
    return relativeHeight * FancyTable.rowUnitHeight
  }

  get width(): number {
    const numValues = this.data?.events.length ?? 0
    return this.labelWidth + numValues * FancyTable.cellWidth
  }

  get labelTextWidth(): number {
    return this.labelElement.node()?.getComputedTextLength() ?? 0
  }

  get requestId(): string {
    return this.config.request
  }

  get group(): SelectionNoData<SVGGElement> {
    return this.contentGroup
  }

  get colorConfig(): FancyTableColorConfig {
    return this._colorConfig
  }

  setData(data: FancyTableData | null) {
    this.data = data
    // Update the row label to update the unit, which is in the series header.
    this.updateLabel()
    // Update row content for the new data.
    this.content.setData(data)
  }

  setLabelWidth(labelWidth: number): void {
    this.labelWidth = labelWidth
    // Update elements for the updated label width.
    this.backgroundElement.attr('width', this.width)
    this.labelElement.attr(
      'x',
      this.labelWidth - FancyTable.textHorizontalMargin,
    )
    this.contentGroup.attr('transform', `translate(${this.labelWidth}, 0)`)
  }

  private createBackground(
    parent: SelectionNoData<SVGGElement>,
    backgroundColor: string,
  ): SelectionNoData<SVGRectElement> {
    return parent
      .append('rect')
      .attr('width', this.width)
      .attr('height', this.height)
      .attr('fill', backgroundColor)
  }

  private createLabel(
    parent: SelectionNoData<SVGGElement>,
  ): SelectionNoData<SVGTextElement> {
    const label = this.createLabelText()

    // Right-align the text and put in in the middle.
    const xPosition = this.labelWidth - FancyTable.textHorizontalMargin
    const yPosition = 0.5 * this.height
    return parent
      .append('text')
      .text(label)
      .attr('x', xPosition)
      .attr('y', yPosition)
      .attr('font-size', FancyTable.fontSize)
      .attr('fill', this._colorConfig.fontColor)
      .attr('text-anchor', 'end')
      .attr('dominant-baseline', 'middle')
  }

  private createContentGroup(
    parent: SelectionNoData<SVGGElement>,
  ): SelectionNoData<SVGGElement> {
    return parent
      .append('g')
      .attr('transform', `translate(${this.labelWidth}, 0)`)
  }

  private createContent(): FancyTableRowContent {
    switch (this.config.type) {
      case RowType.Value:
        return new FancyTableValueContent(this)
      case RowType.ColoredValue:
        return new FancyTableColoredValueContent(this, this.config)
      case RowType.Direction:
        return new FancyTableDirectionContent(this, this.config)
      case RowType.Graph:
        return new FancyTableGraphContent(this, this.config)
    }
  }

  private updateLabel(): void {
    const label = this.createLabelText()
    this.labelElement.text(label)
  }

  private createLabelText(): string {
    let label = this.config.label

    const unit = this.data?.unit
    if (unit) label += ` [${unit}]`
    return label
  }
}
