import { WMSRequestType } from './types'

export function requestJson (url: string): Promise<any> {
  return new Promise((resolve: any, reject: any) => {
    const xhr = new XMLHttpRequest()
    xhr.open('GET', url)

    xhr.onload = function () {
      if (this.status >= 200 && this.status < 300) {
        try {
          const json = JSON.parse(this.responseText)
          resolve(json)
        } catch (err) {
          reject(new Error('Failed to parse json'))
        }
      } else {
        reject(new Error(this.statusText))
      }
    }

    xhr.onerror = function () {
      reject(new Error(this.statusText))
    }
    xhr.send()
  })
}

export function requestAscii (url: string): Promise<string> {
  return new Promise((resolve: any, reject: any) => {
    const xhr = new XMLHttpRequest()
    xhr.open('GET', url)
    xhr.onload = function () {
      if (this.status >= 200 && this.status < 300) {
        resolve(this.responseText)
      } else {
        reject(new Error(this.statusText))
      }
    }
    xhr.onerror = function () {
      reject(new Error(this.statusText))
    }
    xhr.send()
  })
}

export function filterToParams (filter: Record<string, any>): string {
  const filterArgs = Object.entries(filter).flatMap(([key, value]) => {
    if (value === undefined) return []

    const encodedValue = encodeURIComponent(value)
    return [`${key}=${encodedValue}`]
  })

  return filterArgs.length ? '?' + filterArgs.join('&') : ''
}

export function filterToParamsWMS (requestType: WMSRequestType, filter: Record<string, any>): string {
  return filterToParams({ ...{ request: requestType }, ...filter })
}
