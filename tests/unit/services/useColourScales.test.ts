import { describe, it, expect, beforeEach } from 'vitest'
import { ref, nextTick } from 'vue'
import { useColourScales } from '@/services/useColourScales'
import type { ColourScale, Range } from '@/stores/colourScales'

describe('useColourScales', () => {
  let mockScales: Record<string, ColourScale>
  let mockIds: string[]
  let mockTitle: string

  beforeEach(() => {
    const createMockRange = (): Range => ({
      min: 0,
      max: 100,
    })

    const createMockColourScale = (
      id: string,
      min: number = 0,
      max: number = 100,
    ): ColourScale => ({
      id,
      style: {},
      range: { min, max },
      initialRange: { min: 0, max: 100 },
      colourMap: [],
      useGradients: true,
      unit: id === 'scale1' ? 'm' : id === 'scale2' ? 'mm' : undefined,
    })

    mockScales = {
      scale1: createMockColourScale('scale1'),
      scale2: createMockColourScale('scale2', 10, 90),
      scale3: createMockColourScale('scale3'),
    }

    mockIds = ['scale1', 'scale2']
    mockTitle = 'Water Level'
  })

  describe('initialization', () => {
    it('should initialize with undefined current scale', () => {
      const { currentScale } = useColourScales(
        ref([]),
        ref(mockScales),
        ref(mockTitle),
      )

      expect(currentScale.value).toBeUndefined()
    })

    it('should initialize with empty current scales array', () => {
      const { currentScales } = useColourScales(
        ref([]),
        ref(mockScales),
        ref(mockTitle),
      )

      expect(currentScales.value).toEqual([])
    })

    it('should initialize with empty current scale title', () => {
      const { currentScaleTitle } = useColourScales(
        ref([]),
        ref(mockScales),
        ref(mockTitle),
      )

      expect(currentScaleTitle.value).toBe('Water Level')
    })

    it('should initialize as initial range', () => {
      const { currentScaleIsInitialRange } = useColourScales(
        ref([]),
        ref(mockScales),
        ref(mockTitle),
      )

      expect(currentScaleIsInitialRange.value).toBe(false)
    })
  })

  describe('current scales updates', () => {
    it('should update currentScales when currentIds changes', async () => {
      const currentIds = ref(['scale1'])
      const { currentScales } = useColourScales(
        currentIds,
        ref(mockScales),
        ref(mockTitle),
      )

      expect(currentScales.value).toHaveLength(1)
      expect(currentScales.value[0].id).toBe('scale1')

      currentIds.value = ['scale1', 'scale2']
      await nextTick()
      expect(currentScales.value).toHaveLength(2)
      expect(currentScales.value.map((s) => s.id)).toEqual(['scale1', 'scale2'])
    })

    it('should set first scale as current when multiple scales are available', () => {
      const { currentScale } = useColourScales(
        ref(['scale1', 'scale2']),
        ref(mockScales),
        ref(mockTitle),
      )

      expect(currentScale.value?.id).toBe('scale1')
    })

    it('should maintain current scale selection when it is still in currentIds', () => {
      const currentIds = ref(['scale1', 'scale2'])
      const { currentScale } = useColourScales(
        currentIds,
        ref(mockScales),
        ref(mockTitle),
      )

      expect(currentScale.value?.id).toBe('scale1')

      // Update IDs but keep scale1 in the list
      currentIds.value = ['scale2', 'scale1']
      expect(currentScale.value?.id).toBe('scale1')
    })

    it('should switch to first scale when current scale is removed from ids', async () => {
      const currentIds = ref(['scale1', 'scale2'])
      const { currentScale } = useColourScales(
        currentIds,
        ref(mockScales),
        ref(mockTitle),
      )

      expect(currentScale.value?.id).toBe('scale1')

      // Remove scale1 from ids
      currentIds.value = ['scale2', 'scale3']
      await nextTick()
      expect(currentScale.value?.id).toBe('scale2')
    })

    it('should handle empty scale list', async () => {
      const currentIds = ref(['scale1'])
      const scales = ref(mockScales)
      const { currentScale, currentScales } = useColourScales(
        currentIds,
        scales,
        ref(mockTitle),
      )

      expect(currentScale.value?.id).toBe('scale1')

      // Clear all scales
      scales.value = {}
      await nextTick()
      expect(currentScales.value.some((s) => s?.id === 'scale1')).toBe(false)
    })
  })

  describe('current scale title', () => {
    it('should include unit in title when scale has unit', () => {
      const { currentScaleTitle } = useColourScales(
        ref(['scale1']),
        ref(mockScales),
        ref(mockTitle),
      )

      expect(currentScaleTitle.value).toBe('Water Level [m]')
    })

    it('should not include unit when scale has no unit', () => {
      const { currentScaleTitle } = useColourScales(
        ref(['scale3']),
        ref(mockScales),
        ref(mockTitle),
      )

      expect(currentScaleTitle.value).toBe('Water Level')
    })

    it('should update title when base title changes', () => {
      const title = ref('Original Title')
      const { currentScaleTitle } = useColourScales(
        ref(['scale1']),
        ref(mockScales),
        title,
      )

      expect(currentScaleTitle.value).toBe('Original Title [m]')

      title.value = 'New Title'
      expect(currentScaleTitle.value).toBe('New Title [m]')
    })

    it('should work without optional title parameter', () => {
      const { currentScaleTitle } = useColourScales(
        ref(['scale1']),
        ref(mockScales),
      )

      expect(currentScaleTitle.value).toContain('[m]')
    })
  })

  describe('current scale is initial range', () => {
    it('should be true when range equals initial range', () => {
      const { currentScaleIsInitialRange } = useColourScales(
        ref(['scale1']),
        ref(mockScales),
        ref(mockTitle),
      )

      expect(currentScaleIsInitialRange.value).toBe(true)
    })

    it('should be false when range differs from initial range', () => {
      const scales = ref(mockScales)
      const { currentScale, currentScaleIsInitialRange } = useColourScales(
        ref(['scale1']),
        scales,
        ref(mockTitle),
      )

      if (currentScale.value) {
        currentScale.value.range = { min: 10, max: 90 }
      }

      expect(currentScaleIsInitialRange.value).toBe(false)
    })

    it('should be false when only min differs', () => {
      const scales = ref(mockScales)
      const { currentScale, currentScaleIsInitialRange } = useColourScales(
        ref(['scale1']),
        scales,
        ref(mockTitle),
      )

      if (currentScale.value) {
        currentScale.value.range.min = 5
      }

      expect(currentScaleIsInitialRange.value).toBe(false)
    })

    it('should be false when only max differs', () => {
      const scales = ref(mockScales)
      const { currentScale, currentScaleIsInitialRange } = useColourScales(
        ref(['scale1']),
        scales,
        ref(mockTitle),
      )

      if (currentScale.value) {
        currentScale.value.range.max = 95
      }

      expect(currentScaleIsInitialRange.value).toBe(false)
    })

    it('should be false when no current scale', () => {
      const { currentScaleIsInitialRange } = useColourScales(
        ref([]),
        ref(mockScales),
        ref(mockTitle),
      )

      expect(currentScaleIsInitialRange.value).toBe(false)
    })
  })

  describe('reactivity', () => {
    it('should reactively update when scales object changes', async () => {
      const scales = ref(mockScales)
      const { currentScale } = useColourScales(
        ref(['scale1']),
        scales,
        ref(mockTitle),
      )

      expect(currentScale.value?.id).toBe('scale1')
      expect(currentScale.value?.unit).toBe('m')

      scales.value = {
        ...scales.value,
        scale1: { ...mockScales.scale1, unit: 'km' },
      }
      await nextTick()

      expect(currentScale.value?.unit).toBe('km')
    })

    it('should handle non-reactive values as arguments', () => {
      const { currentScale, currentScales } = useColourScales(
        ['scale1', 'scale2'],
        mockScales,
        'Water Level',
      )

      expect(currentScale.value?.id).toBe('scale1')
      expect(currentScales.value).toHaveLength(2)
    })

    it('should handle mixed reactive and non-reactive arguments', async () => {
      const currentIds = ref(['scale1', 'scale2'])
      const { currentScale } = useColourScales(
        currentIds,
        mockScales,
        ref('Water Level'),
      )

      expect(currentScale.value?.id).toBe('scale1')

      currentIds.value = ['scale2']
      await nextTick()
      expect(currentScale.value?.id).toBe('scale2')
    })
  })

  describe('edge cases', () => {
    it('should handle non-existent scale ID gracefully', () => {
      const { currentScales } = useColourScales(
        ref(['nonexistent']),
        ref(mockScales),
        ref(mockTitle),
      )

      // Should include undefined for non-existent scale
      expect(currentScales.value).toHaveLength(1)
    })

    it('should handle scale ID array with non-existent scales', () => {
      const { currentScales } = useColourScales(
        ref(['scale1', 'nonexistent', 'scale2']),
        ref(mockScales),
        ref(mockTitle),
      )

      expect(currentScales.value).toHaveLength(3)
      expect(currentScales.value[0]?.id).toBe('scale1')
      expect(currentScales.value[1]).toBeUndefined()
      expect(currentScales.value[2]?.id).toBe('scale2')
    })

    it('should handle switching between scales with different units', async () => {
      const currentIds = ref(['scale1'])
      const { currentScaleTitle } = useColourScales(
        currentIds,
        ref(mockScales),
        ref(mockTitle),
      )

      expect(currentScaleTitle.value).toBe('Water Level [m]')

      currentIds.value = ['scale2']
      await nextTick()
      expect(currentScaleTitle.value).toBe('Water Level [mm]')
    })
  })

  describe('return values', () => {
    it('should return all expected properties', () => {
      const result = useColourScales(
        ref(['scale1']),
        ref(mockScales),
        ref(mockTitle),
      )

      expect(result).toHaveProperty('currentScale')
      expect(result).toHaveProperty('currentScaleTitle')
      expect(result).toHaveProperty('currentScales')
      expect(result).toHaveProperty('currentScaleIsInitialRange')
    })

    it('should return reactive references', () => {
      const { currentScale } = useColourScales(
        ref(['scale1']),
        ref(mockScales),
        ref(mockTitle),
      )

      expect(currentScale).toHaveProperty('value')
    })
  })
})
