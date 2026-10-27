export const DYNAMIC_REPORT_NODE_SELECTOR = '[data-input-type]'

export interface DynamicReportNode {
  /** Unique key of the node within the report */
  key: string
  /** Element in the report the Vue component is rendered in */
  element: HTMLElement
  inputType: string
  timeSeriesIndex: number
  time: string
  /** Initial value, taken from the text content of the element */
  value: string
}

export interface DynamicReportEdit {
  timeSeriesIndex: number
  time: string
  value: string
}

export function getEditKey(edit: Omit<DynamicReportEdit, 'value'>): string {
  return `${edit.timeSeriesIndex}|${edit.time}`
}

/**
 * Find the elements in the report that should be replaced by a Vue component.
 *
 * Expected markup:
 * <span data-input-type="number" data-time-series-index="0"
 *       data-time="2026-10-27T06:00:00Z">12.3</span>
 *
 * The content of a matched element is removed, so the Vue component can
 * take its place.
 */
export function findDynamicReportNodes(root: ParentNode): DynamicReportNode[] {
  const elements = root.querySelectorAll<HTMLElement>(
    DYNAMIC_REPORT_NODE_SELECTOR,
  )
  const nodes: DynamicReportNode[] = []
  elements.forEach((element, index) => {
    const { inputType, timeSeriesIndex, time } = element.dataset
    const parsedIndex = Number(timeSeriesIndex)
    if (!inputType || !time || timeSeriesIndex === '' || isNaN(parsedIndex)) {
      console.warn('Invalid dynamic report input element', element)
      return
    }
    const value = element.textContent?.trim() ?? ''
    element.replaceChildren()
    nodes.push({
      key: `${index}`,
      element,
      inputType,
      timeSeriesIndex: parsedIndex,
      time,
      value,
    })
  })
  return nodes
}
