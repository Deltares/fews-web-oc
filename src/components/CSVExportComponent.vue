<template>
  <div class="csv-export">
    <v-btn
      @click="downloadCSV"
      icon
    >
      <v-icon>mdi-file-download</v-icon>
    </v-btn>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import { Series } from '@/lib/TimeSeries'
import { ChartConfig } from './TimeSeriesComponent/lib/ChartConfig'
import {getUniqueSeriesIds} from "@/components/TimeSeriesComponent/lib/getUniqueSeriesIds";
import {TableHeaders} from "@/components/TimeSeriesComponent/lib/TableHeaders";
import {createTableHeaders} from "@/components/TimeSeriesComponent/lib/createTableHeaders";
import { createTableData, csvDateFormatter } from './TimeSeriesComponent/lib/createTableData';
import { forEach } from 'lodash';


@Component
export default class CSVExportComponent extends Vue {
  @Prop({
    default: () => {
      return {}
    }
  })
  series!: Record<string, Series>

  @Prop({
    default: () => {
      return {}
    }
  })
  value!: ChartConfig

  seriesIds: string[] = []
  tableData: Record<string, unknown>[] = []
  tableHeaders: TableHeaders[] = []

  downloadCSV() {
    const separator = ','
    const lines = []
    this.seriesIds = getUniqueSeriesIds(this.value.series)
    this.tableHeaders = createTableHeaders(this.value.series, this.seriesIds)
    this.tableData = createTableData(this.value.series, this.series, this.seriesIds, csvDateFormatter)

    // Generate CSV header with columns for each time series.
    const header = this.tableHeaders.reduce((acc, h) => {
      return `${acc}"${h.text}"${separator}`
    }, "")
    lines.push(header)

    forEach(this.tableData, (d) => {
      let line = ""
      forEach(this.tableHeaders, (h) => {
        // if this is not a numeric value or unknown, add quotes around it
        const value = `${d[h.value]}`
        if (!d[h.value]) {
          line += separator
        }
        else if(!isNaN(parseFloat(value))){
          line += `${d[h.value]}${separator}`
        }
        else {
          line += `"${d[h.value]}"${separator}`
        }
      })
      lines.push(line)
    })
    let location = this.value.title
    // Replace spaces with underscores and convert to lowercase.
    location = location.toLowerCase().replaceAll(' ', '_')

    const params = this.$route.params
    const coordinates = params.longitude !== '' ? `_lng${params.longitude}_lat${params.latitude}` : ''
    // generate a filename based on the category variable and location
    const filename = `${params.categoryId}_${params.dataLayerId}_${location}${coordinates}.csv`

    this.generateCSVFile(filename, lines)
  }

  // Generates a CSV file from the array of lines and downloads it.
  private generateCSVFile(filename: string, lines: string[]): void {
    // Create CSV file and associated file URL.
    const file = new File([lines.join('\n')], filename, { type: "text/csv", });
    const url = URL.createObjectURL(file)

    // Some trickery to make sure that we can specify a default file name
    // for the url, other than some hash. We create a hidden <a> tag,
    // set some attributes, and then trigger a click event on it.
    const link = document.createElement("a")
    link.setAttribute('style', 'display: none')
    link.setAttribute('href', url.toString())
    link.setAttribute('download', filename)

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    window.URL.revokeObjectURL(url)
  }
}
</script>
