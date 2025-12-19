<template>
  <ProductView
    :productKey="productKey"
    :tableConfig="tableLayout"
    :archiveProducts="archiveProducts"
    :relativeViewPeriod="config?.relativeViewPeriod"
    :editPermissions="config?.editPermissions"
  />
</template>

<script setup lang="ts">
import type { DisplayCompose } from '@/lib/products'
import ProductView from '@/components/products/ProductView.vue'
import { computed } from 'vue'
import type { ProductBrowserTableConfig } from '@/components/products/ProductsBrowserTable.vue'

interface Props {
  config?: DisplayCompose
  productKey?: string
}

const { config, productKey } = defineProps<Props>()

const archiveProducts = computed(() => {
  const product = config?.compose?.archiveProduct
  return product ? [product] : []
})

const tableLayout: ProductBrowserTableConfig = {
  preview: false,
  type: 'table',
  headers: [],
}
</script>
