import Regridder from '@/components/Regridder.vue'

export class DownloadControl {
  bbox: number[] | null = null
  private container!: HTMLElement
  private vueComponent: Regridder

  constructor(bbox: number[] | null, vueComponent: Regridder) {
    this.bbox = bbox
    this.vueComponent = vueComponent
  }

  onAdd() {
    const btn = document.createElement('button')
    btn.className = 'mapboxgl-ctrl-download'
    btn.type = 'button'
    
    // don't inherit the color from the app theme, that would make it invisible
    btn.style.color = '#2c3e50'
    
    if (this.bbox === null) {
      btn.disabled = true
    } else {
      btn.disabled = false
    }

    const icon = document.createElement('i')
    icon.id = 'download-icon'
    icon.className = 'mdi mdi-download mdi-24px'
    
    btn.appendChild(icon)
    btn.onclick = () => {
      this.showPopup()
    }

    this.container = document.createElement('div')
    this.container.className = 'mapboxgl-ctrl-group mapboxgl-ctrl'
    this.container.appendChild(btn)

    return this.container
  }

  onRemove() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container)
    }
  }

  private showPopup() {
    if (this.vueComponent) {
      this.vueComponent.downloadDialog = true
    }
  }
}
