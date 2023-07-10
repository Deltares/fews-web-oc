export function allLocales(): __WebpackModuleApi.RequireContext {
  return require.context('./../../locales', true, /[A-Za-z0-9-_,\s]+\.json$/i)
}
