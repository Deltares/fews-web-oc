export interface ConfigState {
  defaultComponent?: string
  components: { [key: string]: WebOCComponent }
}

export interface WebOCComponent {
  id: string
  component: string
  title: string
  icon: string
  params? : { [key: string]: string}
}
