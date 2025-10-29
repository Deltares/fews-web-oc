import type { Overlay } from '@deltares/fews-pi-requests'
import { getLayerId, getSourceId, mapIds } from './ids'

function prefix(overlay: Overlay): string {
  return `overlay-${overlay.id}`
}

export function getOverlayLayerId(overlay: Overlay): string {
  switch (overlay.type) {
    case 'overLay':
      return getLayerId(prefix(overlay))
    case 'gridLayer':
      return mapIds.wms.layer
  }
}

export function getOverlaySourceId(overlay: Overlay): string {
  switch (overlay.type) {
    case 'overLay':
      return getSourceId(prefix(overlay))
    case 'gridLayer':
      return mapIds.wms.source
  }
}
