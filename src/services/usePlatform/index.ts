import { Capacitor } from '@capacitor/core'

export type NativePlatform = 'android' | 'ios' | 'web'

/**
 * Facts about the client the app is running in.
 *
 * These are deliberately plain values rather than refs: none of them can change
 * without a reload, so making them reactive would only invite needless watchers.
 *
 * Note that the same deployed bundle serves desktop browsers, mobile browsers and
 * the Capacitor app: the WebView loads the remote origin and Capacitor injects its
 * bridge into that page. So anything gated on `isNativeApp` is shipped to every
 * client but only takes effect inside the app.
 */
export interface PlatformInfo {
  /**
   * Running inside the Capacitor app rather than a browser. This is the check to
   * use for app-only behaviour; it is false in a mobile browser and false in an
   * installed PWA, both of which are still browsers.
   */
  isNativeApp: boolean
  /** Concrete platform: 'android' or 'ios' in the app, 'web' in any browser. */
  platform: NativePlatform
  /** Launched from an installed PWA (browser, but without browser chrome). */
  isInstalledPWA: boolean
  /**
   * The client has no browser chrome of its own, so the app has to supply
   * everything a user would otherwise get from the browser: back navigation,
   * a title, and safe-area padding.
   */
  isStandalone: boolean
}

export function usePlatform(): PlatformInfo {
  const isNativeApp = Capacitor.isNativePlatform()
  const platform = Capacitor.getPlatform() as NativePlatform

  // matchMedia is missing in non-browser test environments.
  const isInstalledPWA =
    globalThis.matchMedia?.('(display-mode: standalone)').matches ?? false

  return {
    isNativeApp,
    platform,
    isInstalledPWA,
    isStandalone: isNativeApp || isInstalledPWA,
  }
}

/**
 * Marks the document root so stylesheets can target the app without every
 * component needing to branch in script. Call once during startup.
 *
 * Enables `html.is-native-app .my-component { ... }` and, in a Vue SFC,
 * `:global(.is-native-app) .my-component { ... }`.
 */
export function applyPlatformClasses(
  root: HTMLElement = document.documentElement,
): void {
  const { isNativeApp, platform, isStandalone } = usePlatform()
  root.classList.toggle('is-native-app', isNativeApp)
  root.classList.toggle('is-standalone', isStandalone)
  root.classList.add(`is-platform-${platform}`)
}
