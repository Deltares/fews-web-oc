import {
  WhatIfTemplateBooleanProperty,
  WhatIfTemplateConfigFileProperty,
  WhatIfTemplateDateTimeProperty,
  WhatIfTemplateDoubleProperty,
  WhatIfTemplateEnumProperty,
  WhatIfTemplateIntProperty,
  WhatIfTemplateMultiProperty,
  WhatIfTemplateStringProperty,
  WhatIfTemplateTemplateProperty,
} from '@deltares/fews-pi-requests'

export type WhatIfProperty = Pick<
  | WhatIfTemplateConfigFileProperty
  | WhatIfTemplateBooleanProperty
  | WhatIfTemplateIntProperty
  | WhatIfTemplateDoubleProperty
  | WhatIfTemplateStringProperty
  | WhatIfTemplateDateTimeProperty
  | WhatIfTemplateTemplateProperty
  | WhatIfTemplateEnumProperty
  | WhatIfTemplateMultiProperty,
  'id' | 'type'
>
