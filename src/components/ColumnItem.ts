import { Location } from 'vue-router'

export interface ColumnItem {
  id: string;
  name: string;
  children?: ColumnItem[];
  to?: Location;
  href?: string;
  target?: string;
  icon?: string;
  nodata?: boolean;
  filterIds?: string[];
  wmsLayerId?: string;
}
