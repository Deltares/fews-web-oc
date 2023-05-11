import {getUniqueSeriesIds} from "@/components/TimeSeriesComponent/lib/getUniqueSeriesIds";
import {ChartSeries} from "@/components/TimeSeriesComponent/lib/ChartSeries";
import {ChartSeriesOptions} from "@/components/TimeSeriesComponent/lib/ChartSeriesOptions";

describe('creat unique series ids', () => {
  it('test empty series', () => {
    const series: ChartSeries[] = [];
    const res = getUniqueSeriesIds(series);
    expect(res.length).toBe(0)
  })

  it('test single series', () => {
    let series: ChartSeries[] = [];

    const options: ChartSeriesOptions = {
      x: {axisIndex: 0, key: ""}, y: {axisIndex: 0, key: ""}
    }
    const firstSeries: ChartSeries = {
      dataResources: [],
      id: "first",
      name: "",
      options: options,
      style: {},
      type: "",
      unit: "",
      visibleInLegend: true,
      visibleInPlot: true,
      visibleInTable: true
    }
    const secondSeries: ChartSeries = {
      dataResources: [],
      id: "second",
      name: "",
      options: options,
      style: {},
      type: "",
      unit: "",
      visibleInLegend: true,
      visibleInPlot: true,
      visibleInTable: true
    }
    series.push(firstSeries)
    series.push(secondSeries)
    let res = getUniqueSeriesIds(series);
    expect(res.length).toBe(2)
    expect(res[0]).toBe("first")
    expect(res[1]).toBe("second")

    series = [];
    firstSeries.visibleInTable = false;
    series.push(firstSeries)
    series.push(secondSeries)
    res = getUniqueSeriesIds(series);
    expect(res.length).toBe(1)
    expect(res[0]).toBe("second")
  })

})
