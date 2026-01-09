<template>
  <ProductView
    :productKey="productKey"
    :tableConfig="tableLayout"
    :archiveProducts="archiveProducts"
    :relativeViewPeriod="config?.relativeViewPeriod"
    :editPermissions="config?.editPermissions"
    :templates="latestTemplateProducts"
  />
</template>

<script setup lang="ts">
import type { DisplayCompose } from '@/lib/products'
import ProductView from '@/components/products/ProductView.vue'
import { computed } from 'vue'
import type { ProductBrowserTableConfig } from '@/components/products/ProductsBrowserTable.vue'
import { configManager } from '@/services/application-config'
import { useProducts } from '@/services/useProducts'
import { periodToIntervalItem } from '@/lib/TimeControl/interval'
import { ProductMetaDataType } from '@/services/useProducts/types'

interface Props {
  config: DisplayCompose
  productKey?: string
}

const { config, productKey } = defineProps<Props>()

const archiveProducts = computed(() => {
  return config?.compose?.map((item) => item.archiveProduct) ?? []
})

const templates = computed(() => {
  return config?.compose?.map((item) => item.template) ?? []
})

const viewPeriod = computed(() =>
  config.relativeViewPeriod
    ? periodToIntervalItem(config.relativeViewPeriod)
    : {},
)

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const { products: templateProducts } = useProducts(
  baseUrl,
  viewPeriod,
  templates,
)

function isNewer(a: ProductMetaDataType, b: ProductMetaDataType): boolean {
  if (a.version !== b.version) {
    return a.version > b.version
  }
  return new Date(a.timeZero).getTime() > new Date(b.timeZero).getTime()
}

const latestTemplateProducts = computed(() => {
  const latestMap = new Map<string, ProductMetaDataType>()
  for (const product of templateProducts.value) {
    const key = product.attributes['productId']

    const existing = latestMap.get(key)
    if (!existing || isNewer(product, existing)) {
      latestMap.set(key, product)
    }
  }
  return Array.from(latestMap.values())
})

const tableLayout: ProductBrowserTableConfig = {
  preview: false,
  type: 'table',
  headers: [
    {
      title: 'Name',
      attribute: 'name',
    },
    {
      title: 'Author',
      attribute: 'author',
    },
    {
      title: 'Creation Time',
      property: 'timeZero',
    },
  ],
}
</script>
