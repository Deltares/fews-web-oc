import { test } from '@playwright/test'

const fewsVersions = ['202401', '202402', '202501', '202502', '202601'] as const
type FewsVersion = (typeof fewsVersions)[number]

function getFewsVersion(): FewsVersion {
  const version = process.env.FEWS_VERSION

  if (version === undefined) {
    // Default to the latest version
    return fewsVersions[fewsVersions.length - 1]
  }

  return version as FewsVersion
}

function isVersionAtLeast(current: string, required: string): boolean {
  return Number(current) >= Number(required)
}

/**
 * Conditionally describes a test suite based on the FEWS version.
 * If the current FEWS version is less than the specified version,
 * the test suite will be skipped.
 *
 * @param version - The minimum FEWS version required to run the test suite.
 * @param title - The title of the test suite.
 * @param callback - The callback function containing the test suite.
 */
export function testFromVersion(
  version: FewsVersion,
  title: string,
  callback: () => void,
) {
  const currentVersion = getFewsVersion()
  if (!isVersionAtLeast(currentVersion, version)) {
    return test.skip(title, callback)
  }

  return test(title, callback)
}

/**
 * Wraps a test.describe block to conditionally skip tests based on the FEWS version.
 * If the current FEWS version is less than the specified version, the entire describe block is skipped.
 *
 * @param version - The minimum FEWS version required to run the tests in this describe block.
 * @param title - The title of the describe block.
 * @param callback - The callback function containing the tests.
 */
export function describeFromVersion(
  version: FewsVersion,
  title: string,
  callback: () => void,
) {
  const currentVersion = getFewsVersion()
  if (!isVersionAtLeast(currentVersion, version)) {
    return test.describe.skip(title, callback)
  }

  return test.describe(title, callback)
}
