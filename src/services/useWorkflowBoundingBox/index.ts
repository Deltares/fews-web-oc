import { computed, watch, nextTick, Ref } from 'vue'
import { useBoundingBox } from '@/services/useBoundingBox'

import { PartialProcessDataFilter, useWorkflowsStore } from '@/stores/workflows'

import { LngLat } from 'maplibre-gl'
import {
  coordinateToString,
  isBoundingBoxInFormData,
  isCoordinateInFormData,
} from '@/lib/workflows'
import { ScenarioData } from '@/lib/whatif'

export function useWorkflowBoundingBox(data: Ref<ScenarioData>) {
  const {
    boundingBox,
    longitudeStepSize,
    latitudeStepSize,
    boundingBoxIsValid,
    boundingBoxString,
  } = useBoundingBox(1, 1)

  const workflowsStore = useWorkflowsStore()

  let isRounding = false
  watch(
    () => workflowsStore.boundingBox,
    () => {
      // Make sure that we do not introduce an infinite watch loop. We only want
      // to set the bounding box in the store once when the bounding box is
      // changed from the outside (e.g. when drawing), to make sure it is rounded
      // properly.
      if (isRounding) return
      isRounding = true

      boundingBox.value = workflowsStore.boundingBox
      // Assigning the bounding box will round its values appropriately, so we
      // assign the rounded bounding box back.
      workflowsStore.boundingBox = boundingBox.value

      // We are done rounding at the next tick, when all watchers have finished.
      nextTick(() => (isRounding = false))
    },
  )

  // Check whether the bounding box is defined in the form.
  const isBoundingBoxInForm = computed(() =>
    isBoundingBoxInFormData(data.value),
  )
  const isCoordinateInForm = computed(() => isCoordinateInFormData(data.value))

  watch(
    data,
    () => {
      // Update the lat/lon step sizes when the appropriate fields are changed in
      // the form.
      const xCellSize = data.value.xCellSize
      const yCellSize = data.value.yCellSize
      if (typeof xCellSize === 'number' && xCellSize > 0) {
        longitudeStepSize.value = xCellSize
      }
      if (typeof yCellSize === 'number' && yCellSize > 0) {
        latitudeStepSize.value = yCellSize
      }

      if (isBoundingBoxInForm.value) {
        boundingBox.value = {
          lonMin: data.value.xMin as number,
          latMin: data.value.yMin as number,
          lonMax: data.value.xMax as number,
          latMax: data.value.yMax as number,
        }
      } else {
        boundingBox.value = null
      }

      if (isCoordinateInForm.value) {
        workflowsStore.coordinate = new LngLat(
          +(data.value.longitude as number | string),
          +(data.value.latitude as number | string),
        )
      } else {
        workflowsStore.coordinate = null
        workflowsStore.isSelectingCoordinate = false
      }
    },
    { immediate: true },
  )

  // Update the form when the bounding box is changed (e.g. through clicking).
  watch(
    boundingBox,
    () => {
      if (!isBoundingBoxInForm.value) return

      if (boundingBox.value === null) {
        data.value.xMin = undefined
        data.value.yMin = undefined
        data.value.xMax = undefined
        data.value.yMax = undefined
      } else {
        data.value.xMin = boundingBox.value.lonMin
        data.value.yMin = boundingBox.value.latMin
        data.value.xMax = boundingBox.value.lonMax
        data.value.yMax = boundingBox.value.latMax
      }
      if (boundingBoxIsValid.value) {
        workflowsStore.boundingBox = boundingBox.value
      }
    },
    { immediate: true },
  )

  watch(
    () => workflowsStore.coordinate,
    () => {
      if (!isCoordinateInForm.value) return

      if (workflowsStore.coordinate === null) {
        data.value.latitude = undefined
        data.value.longitude = undefined
      } else {
        data.value.latitude = +workflowsStore.coordinate.lat.toFixed(5)
        data.value.longitude = +workflowsStore.coordinate.lng.toFixed(5)
      }
    },
  )

  const coordinateString = computed(() =>
    coordinateToString(workflowsStore.coordinate),
  )

  function showCoordinateSelector() {
    workflowsStore.isSelectingCoordinate = true

    watch(
      () => workflowsStore.isSelectingCoordinate,
      () => {},
      { once: true },
    )
  }

  function showMapTool() {
    workflowsStore.isDrawingBoundingBox = true
    // Show the dialog again when the bounding box has been drawn.
    watch(
      () => workflowsStore.isDrawingBoundingBox,
      () => {
        // Only show the dialog if the bounding box is not null, which means the user finished
        // drawing. If it is null, it has been forcibly closed by the application (e.g. because we
        // navigated to a different node), so we should abandon the workflow (and hence the dialog)
        // altogether.
      },
      { once: true },
    )
  }

  function getProcessDataFilter(workflowId: string): PartialProcessDataFilter {
    if (!boundingBoxIsValid.value) {
      throw new Error('Bounding box is invalid')
    }
    const properties = data.value
    return {
      workflowId,
      xMin: properties.xMin as number,
      yMin: properties.yMin as number,
      xMax: properties.xMax as number,
      yMax: properties.yMax as number,
      xCellSize: properties.xCellSize as number,
      yCellSize: properties.yCellSize as number,
    }
  }

  return {
    showMapTool,
    showCoordinateSelector,
    getProcessDataFilter,
    boundingBoxString,
    coordinateString,
    isBoundingBoxInForm,
    isCoordinateInForm,
  }
}
