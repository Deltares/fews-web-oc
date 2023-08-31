import {Map} from 'mapbox-gl'
import Vue from 'vue'

export class DownloadControl {
  bbox: any | undefined
  private _map: Map | undefined
  private _container: HTMLElement | undefined
  private _btn: HTMLButtonElement | undefined
  private _vueComponent: any

  constructor(bbox: any, vueComponent: Vue) {
    this.bbox = bbox
    this._vueComponent = vueComponent
  }

  onAdd(map: Map) {
    this._map = map

    this._btn = document.createElement('button')
    this._btn.className = 'mapboxgl-ctrl-download'
    this._btn.type = 'button'

    const icon = document.createElement('i')
    icon.className = 'fas fa-download'

    this._btn.appendChild(icon)
    this._btn.onclick = () => {
      if (this.bbox !== undefined) {
        this._showPopup()
      } else {
        this._showErrorPopup()
      }
    }

    this._container = document.createElement('div')
    this._container.className = 'mapboxgl-ctrl-group mapboxgl-ctrl'
    this._container.appendChild(this._btn)

    return this._container
  }

  onRemove() {
    if (this._container && this._container.parentNode) {
      this._container.parentNode.removeChild(this._container)
    }
    this._map = undefined
  }

  private _showPopup() {
    if (this._vueComponent) {
        this._vueComponent.downloadDialog = true
    }
  }

  private _showErrorPopup() {
    if (this._vueComponent) {
        this._vueComponent.errorDialog = true
    }
  }
}
