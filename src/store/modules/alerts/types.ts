export interface AlertState {
  alerts: Alert[]
}

export interface Alert {
  id: string
  message: string
  active: boolean
}
