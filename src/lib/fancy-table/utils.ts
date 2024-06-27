import * as d3 from 'd3'

export type SelectionNoData<
  GElement extends d3.BaseType,
  PElement extends d3.BaseType = null,
> = d3.Selection<GElement, undefined, PElement, undefined>
