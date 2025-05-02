import type { TimeSeriesDisplaySubplotItem } from '@deltares/fews-pi-requests'

/**
 * Manages consistent color assignment for chart elements
 */
export class ColorManager {
  private colors: string[] = []
  private seriesColorMap: Map<string, string> = new Map()
  private currentIndex = 0

  /**
   * Initialize the color manager with an array of colors
   */
  public initialize(colors: string[]): void {
    this.colors = colors
    this.currentIndex = 0
  }

  /**
   * Get a color for a series ID, creating a consistent mapping
   */
  public getColorForSeries(seriesId: string): string {
    // Return existing color if already assigned
    if (this.seriesColorMap.has(seriesId)) {
      return this.seriesColorMap.get(seriesId)!
    }

    // Assign next color in rotation
    if (this.colors.length === 0) {
      return '#000000' // Default if no colors available
    }

    const color = this.colors[this.currentIndex % this.colors.length]
    this.seriesColorMap.set(seriesId, color)
    this.currentIndex++
    return color
  }

  /**
   * Apply colors to subplot items based on their IDs
   */
  public applyColorsToSubplotItems(
    items: TimeSeriesDisplaySubplotItem[],
  ): void {
    for (const item of items) {
      // Create a unique ID for the series (parameterId is usually most consistent)
      const seriesId =
        item.parameterId || item.locationId || item.qualifierId || item.request
      if (seriesId && !item.color) {
        item.color = this.getColorForSeries(seriesId)
      }
    }
  }
}

// Create singleton instance
export const colorManager = new ColorManager()
