export function getFileExtension(url: string): string {
  const urlParts = url.toLowerCase().split('.')
  return urlParts[urlParts.length - 1]
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
