// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { InlineReportImageStorage } from '@/lib/dynamic-report/imageStorage'

describe('InlineReportImageStorage', () => {
  it('stores image bytes as a data URL and resolves the reference', async () => {
    const storage = new InlineReportImageStorage()
    const reference = await storage.save(
      new Blob([new Uint8Array([0, 1, 254, 255])], { type: 'image/png' }),
    )

    expect(reference).toBe('data:image/png;base64,AAH+/w==')
    await expect(storage.resolve(reference)).resolves.toBe(reference)
  })

  it('rejects blobs without an image MIME type', async () => {
    const storage = new InlineReportImageStorage()
    await expect(
      storage.save(new Blob(['text'], { type: 'text/plain' })),
    ).rejects.toThrow('Report image must have an image MIME type')
  })

  it('rejects references that are not inline base64 images', async () => {
    const storage = new InlineReportImageStorage()
    await expect(
      storage.resolve('https://example.com/image.png'),
    ).rejects.toThrow('Invalid inline report image reference')
    await expect(
      storage.resolve('data:text/html;base64,PGgxPg=='),
    ).rejects.toThrow('Invalid inline report image reference')
  })

  it('propagates read failures', async () => {
    vi.spyOn(FileReader.prototype, 'readAsDataURL').mockImplementation(
      function () {
        this.dispatchEvent(new ProgressEvent('error'))
      },
    )
    try {
      await expect(
        new InlineReportImageStorage().save(
          new Blob(['x'], { type: 'image/png' }),
        ),
      ).rejects.toThrow('Failed to read report image')
    } finally {
      vi.restoreAllMocks()
    }
  })
})
