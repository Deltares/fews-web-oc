export function getFileExtension(url: string | undefined): string {
  if (!url) return ''

  try {
    const pathname = new URL(url, 'https://example.invalid/').pathname
    const filename = pathname.slice(pathname.lastIndexOf('/') + 1)
    const extensionIndex = filename.lastIndexOf('.')
    return extensionIndex > 0
      ? filename.slice(extensionIndex + 1).toLowerCase()
      : ''
  } catch {
    return ''
  }
}

export type ViewMode = 'html' | 'iframe' | 'img' | 'pdf'
export function getViewMode(extension: string): ViewMode {
  switch (extension) {
    case 'html':
      return 'html'
    case 'png':
    case 'jpg':
    case 'jpeg':
      return 'img'
    case 'pdf':
      return 'pdf'
    default:
      return 'iframe'
  }
}
