import { http, HttpResponse } from 'msw'
import config from './config.json'
import topology from './topology.json'
import splashsceen from './assets/splashsceen.webp'
import logo from './assets/tests-log.png'
import stylesheet from './assets/custom.css?inline'
import sharks from './assets/sharks.csv?raw'

interface Shark {
  Year: string
  LatGIS: string
  LonGIS: string
  Species: string
  Outcome: string
}

// Parse the CSV data
const parsedSharks: Shark[] = sharks
  .split('\n')
  .filter((line) => line.trim() && !line.startsWith('//'))
  .map((line) => {
    const [year, lat, lon, species, outcome] = line.split(',')
    return {
      Year: year,
      LatGIS: lat,
      LonGIS: lon,
      Species: species,
      Outcome: outcome,
    }
  })

export const handlers = [
  // An example handler
  http.get(
    'https://mockserver.dev/FewsWebServices/rest/fewspiservice/v1/weboc/config',
    () => {
      return HttpResponse.json(config)
    },
  ),
  http.get(
    'https://mockserver.dev/FewsWebServices/rest/fewspiservice/v1/weboc/config?documentFormat=PI_JSON',
    () => {
      return HttpResponse.json(config)
    },
  ),
  http.get(
    'https://mockserver.dev/FewsWebServices/rest/fewspiservice/v1/version',
    () => {
      return HttpResponse.json({
        version: {
          implementation: 'Mock Service Worker',
          buildType: 'mock',
          buildNumber: 1,
          buildTime: new Date().toISOString(),
        },
      })
    },
  ),

  http.get(
    'https://mockserver.dev/FewsWebServices/rest/fewspiservice/v1/topology/nodes',
    () => {
      return HttpResponse.json(topology)
    },
  ),
  http.get(
    'https://mockserver.dev/FewsWebServices/rest/fewspiservice/v1/locations',
    ({ request }) => {
      // Extract the URL from the request
      const url = new URL(request.url)
      // Get the filterId parameter
      const filterId = url.searchParams.get('filterId')

      const geosjson = {
        type: 'FeatureCollection',
        features: parsedSharks.map((shark: Shark) => {
          return {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [shark.LonGIS, shark.LatGIS],
            },
            properties: {
              name: shark.Species,
              shortName: shark.Species,
            },
          }
        }),
      }
      if (filterId == 'shark-attacks-southern-hemisphere') {
        // Filter the features based on the filterId
        geosjson.features = geosjson.features.filter(
          (feature) => parseFloat(feature.geometry.coordinates[1]) < 0,
        )
      }
      if (filterId == 'shark-attacks-northern-hemisphere') {
        // Filter the features based on the filterId
        geosjson.features = geosjson.features.filter(
          (feature) => parseFloat(feature.geometry.coordinates[1]) >= 0,
        )
      }
      return HttpResponse.json(geosjson)
    },
  ),

  http.get(
    'https://mockserver.dev/FewsWebServices/rest/fewspiservice/v1/resources/static/splashscreen.webp',
    async () => {
      const fileBuffer = await fetch(splashsceen).then((res) =>
        res.arrayBuffer(),
      )
      return HttpResponse.arrayBuffer(fileBuffer, {
        headers: { 'Content-Type': 'image/webp' },
      })
    },
  ),

  http.get(
    'https://mockserver.dev/FewsWebServices/rest/fewspiservice/v1/resources/static/test-logo.png',
    async () => {
      const fileBuffer = await fetch(logo).then((res) => res.arrayBuffer())
      return HttpResponse.arrayBuffer(fileBuffer, {
        headers: { 'Content-Type': 'image/png' },
      })
    },
  ),

  http.get(
    'https://mockserver.dev/FewsWebServices/rest/fewspiservice/v1/resources/static/custom.css',
    async () => {
      return HttpResponse.text(stylesheet, {
        headers: { 'Content-Type': 'text/css' },
      })
    },
  ),
]
