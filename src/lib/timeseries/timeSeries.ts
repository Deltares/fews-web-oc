import { JsonObject, JsonProperty } from 'typescript-json-serializer'
import type { SeriesHeader } from './types/SeriesHeader.js'
import type { SeriesData } from './types/SeriesData.js'
import {
  SeriesResource,
  SeriesRequest,
  SeriesUrlRequest,
  SeriesDerived,
} from './timeSeriesResource.js'
import MD5 from 'crypto-js/md5'
import type { Domains } from '@deltares/fews-pi-requests'

const timeSeriesResourceType = (resource: SeriesResource) => {
  switch (resource.type) {
    case 'DdApiRequest':
      return SeriesRequest
    case 'FewsPiRequest':
      return SeriesRequest
    case 'UrlRequest':
      return SeriesUrlRequest
    case 'Derived':
      return SeriesDerived
    default:
      return SeriesResource
  }
}

@JsonObject()
export class Series {
  @JsonProperty()
  id: string

  @JsonProperty()
  type = 'TimeSeries'

  @JsonProperty()
  header: SeriesHeader

  @JsonProperty({ type: timeSeriesResourceType })
  resource: SeriesResource | SeriesRequest | SeriesUrlRequest | SeriesDerived

  data?: SeriesData[]
  start?: Date
  end?: Date
  lastUpdated?: Date
  domains?: Domains[]
  missingValue?: string

  constructor(
    resource: SeriesResource | SeriesRequest | SeriesUrlRequest | SeriesDerived,
  ) {
    this.resource = resource
    this.header = {}
    this.id = this.md5Hash
  }

  get md5Hash(): string {
    return MD5(JSON.stringify(this.resource)).toString()
  }

  idIsValid(): boolean {
    return this.id === this.md5Hash
  }

  clone(): Series {
    return Object.assign(Object.create(Object.getPrototypeOf(this)), this)
  }
}
