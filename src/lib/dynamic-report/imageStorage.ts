export interface ReportImageStorage {
  save(image: Blob): Promise<string>
  resolve(reference: string): Promise<string>
}

export class InlineReportImageStorage implements ReportImageStorage {
  async save(image: Blob): Promise<string> {
    if (!image.type.startsWith('image/')) {
      throw new Error('Report image must have an image MIME type')
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result !== 'string') {
          reject(new Error('Failed to encode report image'))
          return
        }
        resolve(reader.result)
      }
      reader.onerror = () =>
        reject(reader.error ?? new Error('Failed to read report image'))
      reader.onabort = () =>
        reject(new Error('Report image encoding was aborted'))
      reader.readAsDataURL(image)
    })
  }

  async resolve(reference: string): Promise<string> {
    if (!/^data:image\/[a-z0-9.+-]+;base64,/i.test(reference)) {
      throw new Error('Invalid inline report image reference')
    }
    return reference
  }
}
