import { http, HttpResponse } from 'msw'
import config from './config.json'
import topology from './topology.json'
import splashsceen from './assets/splashsceen.webp'
import logo from './assets/tests-log.png'
import stylesheet from './assets/custom.css?inline'
import sharks from './assets/sharks.csv'

interface Shark {
  Year: string
  LatGIS: string
  LonGIS: string
  Species: string
  Outcome: string
}

export const handlers = [
  // An example handler
  http.get(
    'https://mockserver.dev/FewsWebServices/rest/fewspiservice/v1/weboc/config',
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
    () => {
      const geosjson = {
        type: 'FeatureCollection',
        features: sharks.map((shark: Shark) => {
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
