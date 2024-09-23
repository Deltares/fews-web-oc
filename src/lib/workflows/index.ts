import { LngLat } from 'maplibre-gl'

export function coordinateToString(coordinate: LngLat | null) {
  return coordinate
    ? `Lat: ${coordinate.lat.toFixed(2)} Lng: ${coordinate.lng.toFixed(2)}`
    : '—'
}
