export interface ScreenshotLimits {
  maxCount: number
  maxEncodedBytes: number
}

export const DEFAULT_SCREENSHOT_LIMITS: ScreenshotLimits = {
  maxCount: 20,
  maxEncodedBytes: 10 * 1024 * 1024,
}

export function checkScreenshotLimits(
  existingReferences: readonly string[],
  newReference: string,
  limits: ScreenshotLimits = DEFAULT_SCREENSHOT_LIMITS,
): void {
  if (!Number.isSafeInteger(limits.maxCount) || limits.maxCount < 1) {
    throw new Error('Screenshot count limit must be a positive integer')
  }
  if (
    !Number.isSafeInteger(limits.maxEncodedBytes) ||
    limits.maxEncodedBytes < 1
  ) {
    throw new Error('Screenshot size limit must be a positive integer')
  }
  if (existingReferences.length >= limits.maxCount) {
    throw new Error(
      `The report cannot contain more than ${limits.maxCount} screenshots`,
    )
  }

  const encoder = new TextEncoder()
  const totalBytes = [...existingReferences, newReference].reduce(
    (total, reference) => total + encoder.encode(reference).byteLength,
    0,
  )
  if (totalBytes > limits.maxEncodedBytes) {
    throw new Error(
      `The report screenshots exceed the ${limits.maxEncodedBytes}-byte encoded size limit`,
    )
  }
}
