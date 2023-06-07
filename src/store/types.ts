import { AlertState } from './modules/alerts/types';
import { SystemTimeState } from './modules/system-time/types';
import { UserSettingsState } from './modules/user-settings/types';

export interface RootState {
  alerts?: AlertState
  systemTime?: SystemTimeState
  userSettings?: UserSettingsState
}
