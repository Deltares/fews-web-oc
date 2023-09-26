import {ChartSeries} from "@/components/TimeSeriesComponent/lib/ChartSeries";
import {ChartSeriesOptions} from "@/components/TimeSeriesComponent/lib/ChartSeriesOptions";
import {createTableData} from "@/components/TimeSeriesComponent/lib/createTableData";
import {Series, SeriesUrlRequest} from "@/lib/TimeSeries";
import {allLocales} from "@/lib/Localization/Locales";

jest.mock('../../../../src/lib/Localization/Locales', () => ({
  allLocales: () => {
    return {
      keys: () => ['en'], resolve: (key: string) => ({
        'en': {settings: {
            'en': "Settings",
            'nl': "Settings"
          }},
      }[key]), id: (key: string) => key,
    };  }
}))
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
    // expect(tableDatumElement).toBe(new Date("2022-03-25").toLocaleString(undefined, {
    //   weekday: 'short',
    //   year: 'numeric',
    //   month: 'short',
    //   day: 'numeric',
    //   hour: 'numeric',
    //   minute: 'numeric',
    //   second: 'numeric',
    //   hour12: false
    // }));
    const tableData0First: any = tableData[0]["first"]
    const tableData0Second: any = tableData[0]["second"]
    const tableData1First: any = tableData[1]["first"]
    const tableData1Second: any = tableData[1]["second"]
    const tableData2First: any = tableData[2]["first"]
    const tableData2Second: any = tableData[2]["second"]
    expect(tableData0First.value).toBe(3);
    expect(JSON.stringify(tableData0Second)).toBe("{}")
    expect(tableData1First.value).toBe(4);
    expect(tableData1Second.value).toBe(13)
    expect(JSON.stringify(tableData2First)).toBe("{}")
    expect(tableData2Second.value).toBe(14)
  })

})
