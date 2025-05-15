import { http, HttpResponse } from 'msw'
import config from './config.json'
import topology from './topology.json'
import actions from './actions.json'
import splashsceen from './assets/splashsceen.webp'
import logo from './assets/tests-log.png'
import stylesheet from './assets/custom.css?inline'
import sharks from './assets/sharks.csv?raw'

interface Shark {
  Year: string
  LatGIS: string
  LonGIS: string
  Location: string
  Species: string
  Outcome: string
}

// Parse the CSV data
const parsedSharks: Shark[] = sharks
  .split('\n')
  .filter((line) => line.trim() && !line.startsWith('//'))
  .map((line) => {
    const [year, lat, lon, loc, species, outcome] = line.split(',')
    return {
      Year: year,
      LatGIS: lat,
      LonGIS: lon,
      Location: loc,
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
              locationId: shark.Location.split(' ').join('_'),
              locationName: shark.Location,
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

  // Handler for topology node actions
  http.get(
    'https://mockserver.dev/FewsWebServices/rest/fewspiservice/v1/filters/actions',
    ({ request }) => {
      const url = new URL(request.url)
      const locationIds = url.searchParams.get('locationIds')

      let filteredActions = { ...actions }

      // If locationIds provided, replace placeholders in actions
      if (locationIds) {
        // Deep clone the actions to avoid modifying original object
        filteredActions = JSON.parse(JSON.stringify(actions))
        // Set time periods for all actions
        const now = new Date()
        const startDate = new Date(now)
        startDate.setDate(now.getDate() - 5) // 5 days ago
        startDate.setHours(0, 0, 0, 0) // Start of the day
        const endDate = new Date(now)
        endDate.setDate(now.getDate() + 2) // 2 days ahead
        startDate.setHours(23, 59, 59, 999) // End of the day

        // Format dates for FEWS
        const formattedCurrentDate = now.toISOString().replace(/\.\d{3}Z$/, 'Z')
        const formattedStartDate = startDate
          .toISOString()
          .replace(/\.\d{3}Z$/, 'Z')
        const formattedEndDate = endDate.toISOString().replace(/\.\d{3}Z$/, 'Z')

        // Format dates for display in the timeSeriesDisplay config
        const startDateDisplay = {
          date: startDate.toISOString().split('T')[0],
          time: startDate
            .toISOString()
            .split('T')[1]
            .replace(/\.\d{3}Z$/, ''),
        }

        const endDateDisplay = {
          date: endDate.toISOString().split('T')[0],
          time: endDate
            .toISOString()
            .split('T')[1]
            .replace(/\.\d{3}Z$/, ''),
        }

        // Update all actions with the new locationIds and time periods
        filteredActions.results.forEach((result) => {
          if (result.requests) {
            result.requests.forEach((req) => {
              // Replace locationIds placeholder in request URLs
              req.request = req.request.replace(
                /locationIds=[^&]+/,
                `locationIds=${locationIds}`,
              )
              req.historyRequest = req.historyRequest.replace(
                /locationId=[^&]+/,
                `locationId=${locationIds}`,
              )

              // Replace time parameters in request URLs
              req.request = req.request
                .replace(/startTime=[^&]+/, `startTime=${formattedStartDate}`)
                .replace(/endTime=[^&]+/, `endTime=${formattedEndDate}`)
                .replace(
                  /endForecastTime=[^&]+/,
                  `endForecastTime=${formattedCurrentDate}`,
                )
            })
          }

          // Update the config display periods
          if (result.config?.timeSeriesDisplay) {
            // Update the title with the locationId
            result.config.timeSeriesDisplay.title = locationIds
            result.config.timeSeriesDisplay.period = {
              startDate: startDateDisplay,
              endDate: endDateDisplay,
            }

            // Update locationIds in display config items
            if (result.config.timeSeriesDisplay.subplots) {
              result.config.timeSeriesDisplay.subplots.forEach((subplot) => {
                if (subplot.items) {
                  subplot.items.forEach((item) => {
                    if (item.locationId) {
                      item.locationId = locationIds
                    }
                  })
                }
              })
            }
          }
        })
      }

      return HttpResponse.json(filteredActions)
    },
  ),

  // Handler for timeseries data
  http.get(
    'https://mockserver.dev/FewsWebServices/rest/fewspiservice/v1/timeseries',
    ({ request }) => {
      const url = new URL(request.url)
      const locationIds = url.searchParams.get('locationIds')
      const parameterIds = url.searchParams.get('parameterIds')

      // Get start and end times from URL or use defaults relative to current date
      const now = new Date()
      const defaultStartDate = new Date(now)
      defaultStartDate.setDate(now.getDate() - 5) // 5 days ago
      const defaultEndDate = new Date(now)
      defaultEndDate.setDate(now.getDate() + 2) // 2 days ahead

      const startTime =
        url.searchParams.get('startTime') || defaultStartDate.toISOString()
      const endTime =
        url.searchParams.get('endTime') || defaultEndDate.toISOString()

      // Generate mock timeseries data
      const timeSeriesData = {
        timeZone: '0',
        version: '1.0',
        timeSeries: [
          {
            header: {
              type: 'instantaneous',
              moduleInstanceId: 'ImportSharkData',
              locationId: locationIds || 'SAMPLE_LOCATION',
              parameterId: parameterIds || 'SharkAttacks',
              timeStep: {
                unit: 'nonequidistant',
                divider: 1,
              },
              startDate: {
                date: startTime.split('T')[0],
                time: startTime.split('T')[1].replace('Z', ''),
              },
              endDate: {
                date: endTime.split('T')[0],
                time: endTime.split('T')[1].replace('Z', ''),
              },
              missVal: '-999.0',
              stationName: locationIds
                ? `Location ${locationIds}`
                : 'Sample Location',
              lat: '-33.865143',
              lon: '151.209900',
              units: 'count',
            },
            events: generateMockEvents(startTime, endTime, locationIds),
          },
        ],
      }

      return HttpResponse.json(timeSeriesData)
    },
  ),

  // Handler for topology thresholds endpoint
  http.get(
    'https://mockserver.dev/FewsWebServices/rest/fewspiservice/v1/topology/thresholds',
    () => {
      // Return empty topology thresholds
      return HttpResponse.json({
        topologyNodes: [],
      })
    },
  ),

  // Handler for flags endpoint
  http.get(
    'https://mockserver.dev/FewsWebServices/rest/fewspiservice/v1/flags',
    () => {
      return HttpResponse.json({
        flags: [
          {
            flag: '0',
            name: 'No flag',
            description: 'No flag is set',
            colorHash: '#FFFFFF',
            quality: 'RELIABLE',
          },
          {
            flag: '1',
            name: 'Original',
            description: 'Original data',
            colorHash: '#FFFFFF',
            quality: 'RELIABLE',
          },
          {
            flag: '2',
            name: 'Original missing',
            description: 'Original data, missing',
            colorHash: '#FFFFFF',
            quality: 'RELIABLE',
          },
          {
            flag: '3',
            name: 'Interpolated',
            description: 'Interpolated data',
            colorHash: '#FFFF00',
            quality: 'DOUBTFUL',
          },
          {
            flag: '4',
            name: 'Doubtful',
            description: 'Doubtful data',
            colorHash: '#FFC800',
            quality: 'DOUBTFUL',
          },
          {
            flag: '5',
            name: 'Validated',
            description: 'Validated data',
            colorHash: '#FFFFFF',
            quality: 'RELIABLE',
          },
          {
            flag: '6',
            name: 'Missing',
            description: 'Missing data',
            colorHash: '#FFFFFF',
            quality: 'UNRELIABLE',
          },
          {
            flag: '14',
            name: 'Accumulation reset',
            description: 'Accumulation reset',
            colorHash: '#BEIGE',
            quality: 'RELIABLE',
          },
        ],
      })
    },
  ),

  // Handler for flag sources endpoint
  http.get(
    'https://mockserver.dev/FewsWebServices/rest/fewspiservice/v1/flagsources',
    () => {
      return HttpResponse.json({
        flagSources: [
          {
            id: 'SFP',
            name: 'Statistical Flag Procedure',
            description: 'Flags set by statistical analysis',
          },
          {
            id: 'MAN',
            name: 'Manual Flag',
            description: 'Flags set manually by operators',
          },
          {
            id: 'IMP',
            name: 'Imported Flag',
            description: 'Flags imported from external systems',
          },
          {
            id: 'MOD',
            name: 'Model Flag',
            description: 'Flags set by model runs',
          },
        ],
      })
    },
  ),
]

// Helper function to generate mock timeseries events
// We seed this with locationId to get consistent data for the same locationId
function generateMockEvents(
  startTime: string,
  endTime: string,
  locationId?: string | null,
) {
  // Simple random number generator
  function sfc32(a: number, b: number, c: number, d: number) {
    return function () {
      a |= 0
      b |= 0
      c |= 0
      d |= 0
      let t = (((a + b) | 0) + d) | 0
      d = (d + 1) | 0
      a = b ^ (b >>> 9)
      b = (c + (c << 3)) | 0
      c = (c << 21) | (c >>> 11)
      c = (c + t) | 0
      return (t >>> 0) / 4294967296
    }
  }

  // Simple hash to seed generator from string
  function cyrb128(str: string) {
    let h1 = 1779033703,
      h2 = 3144134277,
      h3 = 1013904242,
      h4 = 2773480762
    for (let i = 0, k; i < str.length; i++) {
      k = str.charCodeAt(i)
      h1 = h2 ^ Math.imul(h1 ^ k, 597399067)
      h2 = h3 ^ Math.imul(h2 ^ k, 2869860233)
      h3 = h4 ^ Math.imul(h3 ^ k, 951274213)
      h4 = h1 ^ Math.imul(h4 ^ k, 2716044179)
    }
    h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067)
    h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233)
    h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213)
    h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179)
    ;(h1 ^= h2 ^ h3 ^ h4), (h2 ^= h1), (h3 ^= h1), (h4 ^= h1)
    return [h1 >>> 0, h2 >>> 0, h3 >>> 0, h4 >>> 0]
  }
  const seed = locationId ? cyrb128(locationId) : [1, 2, 3, 4]
  const random = sfc32(seed[0], seed[1], seed[2], seed[3])

  const start = new Date(startTime)
  const end = new Date(endTime)
  const events = []

  // Generate hourly data points with some randomness
  const currentDate = new Date(start)
  const baseValue = 2

  while (currentDate <= end) {
    // Random variation plus some seasonality
    const randomValue = Math.max(0, Math.round(baseValue + (random() * 5 - 1)))

    // Add some peaks and special flags occasionally
    let value = randomValue.toString()
    let flag = '0'

    if (random() > 0.97) {
      // Spike in data - marked as doubtful
      value = (randomValue * (2 + random())).toFixed(1)
      flag = '4' // Doubtful flag
    } else if (random() > 0.98) {
      // Missing data point
      value = '-999.0'
      flag = '6' // Missing data flag
    }

    // Format date and time for FEWS PI format
    const dateStr = currentDate.toISOString().split('T')[0]
    // Format time to HH:MM:SS
    const timeStr = currentDate
      .toISOString()
      .split('T')[1]
      .replace('Z', '')
      .split('.')[0]

    events.push({
      date: dateStr,
      time: timeStr,
      value: value,
      ...(flag && { flag }),
    })

    // Add 1 hour
    currentDate.setHours(currentDate.getHours() + 1)
  }

  return events
}
