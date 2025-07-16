import { test } from '@playwright/test'

const fewsVersions = ['202401', '202402', '202501', '202502'] as const
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

export function testWithVersion(
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

export function describeWithVersion(
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
