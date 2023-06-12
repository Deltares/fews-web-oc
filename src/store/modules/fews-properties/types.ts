import type {TimeSeriesFlag, TimeSeriesFlagSource} from '@deltares/fews-pi-requests';

export interface FewsPropertiesState {
  flags?: TimeSeriesFlag[];
  flagSources?: TimeSeriesFlagSource[];
}
