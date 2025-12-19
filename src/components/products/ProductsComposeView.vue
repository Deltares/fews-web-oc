<template>
  <ProductView
    :productKey="productKey"
    :tableConfig="tableLayout"
    :archiveProducts="archiveProducts"
    :relativeViewPeriod="config?.relativeViewPeriod"
    :editPermissions="config?.editPermissions"
    :template="template"
  />
</template>

<script setup lang="ts">
import type { DisplayCompose } from '@/lib/products'
import ProductView from '@/components/products/ProductView.vue'
import { computed } from 'vue'
import type { ProductBrowserTableConfig } from '@/components/products/ProductsBrowserTable.vue'
import { configManager } from '@/services/application-config'
import { useProduct } from '@/services/useProducts'
import { periodToIntervalItem } from '@/lib/TimeControl/interval'

interface Props {
  config: DisplayCompose
  productKey?: string
}

const { config, productKey } = defineProps<Props>()

const archiveProducts = computed(() => {
  const product = config?.compose?.archiveProduct
  return product ? [product] : []
})

const viewPeriod = computed(() =>
  config.relativeViewPeriod
    ? periodToIntervalItem(config.relativeViewPeriod)
    : {},
)

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const { product: template } = useProduct(
  baseUrl,
  viewPeriod,
  () => config.compose?.template,
)

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
