import { WhatIfTemplate } from '@deltares/fews-pi-requests'

export type WhatIfTemplateProperty = NonNullable<
  WhatIfTemplate['properties']
>[number]

export type PartialWhatIfTemplateProperty = Pick<
  WhatIfTemplateProperty,
  'id' | 'type'
>
