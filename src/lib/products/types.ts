interface KeyValueType {
  key: string
  value: string
}

export interface PostResponse {
  areaId: string
  attributes: Array<KeyValueType>
  dataSetCreationTime: string
  fileSize: number
  relativePathMetaDataFile: string
  relativePathProducts: Array<string>
  sourceId: string
  version: number
  timeZero: string
}
