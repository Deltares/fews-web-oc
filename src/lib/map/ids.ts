import { getLayerId, getSourceId } from './utils'

export const mapIds = {
  wms: {
    layer: getLayerId('wms'),
    source: getSourceId('wms'),
  },
  location: {
    layer: {
      dataAvailability: getLayerId('data-availability'),
      circle: getLayerId('location-circle'),
      symbol: getLayerId('location-symbol'),
      childSymbol: getLayerId('location-child-symbol'),
      text: getLayerId('location-text'),
      fill: getLayerId('location-fill'),
    },
    source: getSourceId('location'),
  },
  coordinate: {
    layer: getLayerId('selected-coordinate'),
    source: getSourceId('selected-coordinate'),
  },
}
