import { WhatIfTemplate } from '@deltares/fews-pi-requests'

export type WhatIfTemplateProperty = Pick<
  NonNullable<WhatIfTemplate['properties']>[number],
  'id' | 'type'
>
