import { AlertState } from './modules/alerts/types';
import { SystemTimeState } from './modules/system-time/types';
import { FewsPropertiesState } from './modules/fews-properties/types';

export interface RootState {
  alerts?: AlertState
  systemTime?: SystemTimeState
  fewsProperties?: FewsPropertiesState
}
