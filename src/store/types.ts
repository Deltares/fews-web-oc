import { AlertState } from './modules/alerts/types';
import { SystemTimeState } from './modules/system-time/types';

export interface RootState {
  alerts?: AlertState
  systemTime?: SystemTimeState
}
