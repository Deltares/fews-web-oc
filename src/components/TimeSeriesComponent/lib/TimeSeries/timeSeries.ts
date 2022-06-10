import { Serializable, JsonProperty } from 'typescript-json-serializer'
import { SeriesHeader } from './types'
import { SeriesResource, SeriesRequest, SeriesUrlRequest, SeriesDerived } from './timeSeriesResource'
import MD5 from 'crypto-js/md5'

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

@Serializable()
export class Series {
  @JsonProperty()
  id: string

  @JsonProperty()
  type = 'TimeSeries'

  @JsonProperty()
  header: SeriesHeader

  @JsonProperty({ predicate: timeSeriesResourceType })
  resource: SeriesResource | SeriesRequest | SeriesUrlRequest | SeriesDerived

  data?: any // eslint-disable-line @typescript-eslint/no-explicit-any
  start?: Date;
  end?: Date;
  lastUpdated?: Date;

  constructor (
    resource: SeriesResource | SeriesRequest | SeriesUrlRequest | SeriesDerived
  ) {
    this.resource = resource
    this.header = {}
    this.id = this.md5Hash
  }

  get md5Hash (): string {
    return MD5(JSON.stringify(this.resource)).toString()
  }

  idIsValid (): boolean {
    return this.id === this.md5Hash
  }
}
