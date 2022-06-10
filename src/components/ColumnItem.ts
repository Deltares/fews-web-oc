import { Location } from 'vue-router'

export interface ColumnItem {
  id: string;
  name: string;
  children?: ColumnItem[];
  to?: Location;
  icon: string;
}
