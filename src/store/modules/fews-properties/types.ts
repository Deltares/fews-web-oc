import type {TimeSeriesFlag, TimeSeriesFlagSource} from '@deltares/fews-pi-requests';

export interface FewsPropertiesState {
  flags?: Record<string,TimeSeriesFlag>;
  flagSources?: Record<string, TimeSeriesFlagSource>;
}
