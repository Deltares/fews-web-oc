import { JsonObject, JsonProperty } from 'typescript-json-serializer'
import { SeriesResourceType, SeriesOperationType } from './types'

export class SeriesResource {
  @JsonProperty()
  type: SeriesResourceType

  constructor (type: SeriesResourceType) {
    this.type = type
  }
}

@JsonObject()
export class SeriesRequest extends SeriesResource {
  @JsonProperty()
  filter: any

  @JsonProperty()
  provider: string

  constructor (provider: string, filter: any) {
    super(SeriesResourceType.DdApiRequest)
    this.provider = provider
    this.filter = filter
  }
}

@JsonObject()
export class SeriesUrlRequest extends SeriesResource {
  @JsonProperty()
  url: string

  @JsonProperty()
  provider: string

  constructor (provider: string, url: string) {
    super(SeriesResourceType.UrlRequest)
    this.provider = provider
    this.url = url
  }
}

@JsonObject()
export class SeriesDerived extends SeriesResource {
  @JsonProperty()
  factor?: number;

  @JsonProperty()
  offset?: number;

  @JsonProperty()
  operator!: string;

  @JsonProperty()
  operationType: SeriesOperationType;

  @JsonProperty()
  dataResources: string[]

  constructor (
    operationType = SeriesOperationType.FactorOffset,
    dataResources: string[] = []) {
    super(SeriesResourceType.Derived)
    this.operationType = operationType
    this.dataResources = dataResources
    this.setOperator(operationType)
  }

  setOperator (operationType: SeriesOperationType) {
    switch (operationType) {
      case SeriesOperationType.FactorOffset:
        this.operator = 'applyFactorOffset'
        break
      case SeriesOperationType.Add:
        this.operator = 'add'
        break
      case SeriesOperationType.Subtract:
        this.operator = 'subtract'
        break
      case SeriesOperationType.Multiply:
        this.operator = 'multiply'
        break
      case SeriesOperationType.Divide:
        this.operator = 'divide'
        break
      case SeriesOperationType.Amplitude:
        this.operator = 'amplitude'
        break
      case SeriesOperationType.WaterDirection:
        this.operator = 'waterDirection'
        break
      case SeriesOperationType.WindDirection:
        this.operator = 'windDirection'
        break
      case SeriesOperationType.VerticalClearance:
        this.operator = 'applyFactorOffset'
        break
      default:
        this.operator = 'undefined'
    }
  }
}
