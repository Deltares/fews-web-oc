import {ChartSeries} from "@/components/TimeSeriesComponent/lib/ChartSeries";
import {createTableHeaders} from "@/components/TimeSeriesComponent/lib/createTableHeaders";
import {ChartSeriesOptions} from "@/components/TimeSeriesComponent/lib/ChartSeriesOptions";

describe('create unique series ids', () => {
  it('test empty series', () => {
    const series: ChartSeries[] = [];
    const options: ChartSeriesOptions = {
      x: {axisIndex: 0, key: ""}, y: {axisIndex: 0, key: ""}
    }
    const firstSeries: ChartSeries = {
      dataResources: [],
      id: "first",
      name: "firstName",
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
      name: "secondName",
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

    const headers = createTableHeaders(series, ["first", "second"])
    expect(headers.length).toBe(3);
    expect(headers[0].text).toBe("Date");
    expect(headers[1].text).toBe("firstName");
    expect(headers[2].text).toBe("secondName");


  })

})
