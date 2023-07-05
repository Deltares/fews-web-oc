import {ChartSeries} from "@/components/TimeSeriesComponent/lib/ChartSeries";
import {ChartSeriesOptions} from "@/components/TimeSeriesComponent/lib/ChartSeriesOptions";
import {createTableData} from "@/components/TimeSeriesComponent/lib/createTableData";
import {Series, SeriesUrlRequest} from "@/lib/TimeSeries";

describe('create table data tests', () => {
  it('test empty series', () => {
    const chartSeries: ChartSeries[] = [];
    const options: ChartSeriesOptions = {
      x: {axisIndex: 0, key: ""}, y: {axisIndex: 0, key: ""}
    }
    const firstChartSeriesDef: ChartSeries = {
      dataResources: ["first"],
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
    const secondChartSeriesDef: ChartSeries = {
      dataResources: ["second"],
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
    chartSeries.push(firstChartSeriesDef)
    chartSeries.push(secondChartSeriesDef)

    const resource = new SeriesUrlRequest('fews-pi', "test".toString())
    const firstSeries = new Series(resource)
    firstSeries.data = [{x: new Date("2022-03-25"), y: 3}, {x: new Date("2022-03-26"), y: 4}]

    const secondSeries = new Series(resource)
    secondSeries.data = [{x: new Date("2022-03-26"), y: 13}, {x: new Date("2022-03-27"), y: 14}]

    const seriesMap: Record<string, Series> = {
      "first": firstSeries,
      "second": secondSeries,
    }

    const tableData: Record<string, unknown>[] = createTableData(chartSeries, seriesMap, ["first", "second"])
    expect(tableData.length).toBe(3);
    const tableDatumElement:string = tableData[0]["date"] as string;
    expect(tableDatumElement).toBe(new Date("2022-03-25").toLocaleString(undefined, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false
    }));
    expect(tableData[0]["first"]).toBe(3);
    expect(tableData[0]["second"]).toBeUndefined();
    expect(tableData[1]["first"]).toBe(4);
    expect(tableData[1]["second"]).toBe(13)
    expect(tableData[2]["first"]).toBeUndefined()
    expect(tableData[2]["second"]).toBe(14)
  })

})
