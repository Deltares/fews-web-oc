import { authenticationManager } from '@/services/authentication/AuthenticationManager'

/**
 * Fetches a blob from the given URL and returns a promise that resolves to a blob URL.
 *
 * Uses XMLHttpRequest to fetch the blob directly without needing to convert it first.
 *
 * @param {string} url - The URL to fetch the blob from.
 * @return {Promise<Blob>} A promise that resolves to the fetched blob.
 * @throws {Error} If the request fails or the response is not a blob.
 */
export async function fetchBlob(url: string): Promise<Blob> {
  const accessToken = authenticationManager.getAccessToken()

  return new Promise((resolve, reject) => {
    const req = new XMLHttpRequest()
    req.responseType = 'blob'
    req.open('GET', url)

    if (accessToken) {
      req.setRequestHeader('Authorization', `Bearer ${accessToken}`)
    }

    req.onload = () => {
      if (req.status === 200) {
        const blob = req.response
        resolve(blob)
      } else {
        reject(
          new Error(`Failed to fetch blob: ${req.status} - ${req.statusText}`),
        )
      }
    }

    req.onerror = () => {
      reject(new Error('Network error while fetching blob'))
    }

    req.ontimeout = () => {
      reject(new Error('Request timed out while fetching blob'))
    }

    req.send()
  })
}
