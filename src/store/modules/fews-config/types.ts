export interface ConfigState {
  components: { [key: string]: WebOCComponent }
}

export interface WebOCComponent {
  id: string
  component: string
  title: string
  icon: string
}
