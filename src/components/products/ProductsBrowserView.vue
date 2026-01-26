<template>
  <ProductView
    :productKey="productKey"
    :tableConfig="tableLayout"
    :archiveProducts="config?.browser.archiveProducts"
    :archiveProductSets="config?.browser.archiveProductSets"
    :relativeViewPeriod="config?.relativeViewPeriod"
    :editPermissions="config?.editPermissions"
  />
</template>

<script setup lang="ts">
import type { DocumentBrowserDisplay } from '@/lib/products'
import ProductView from '@/components/products/ProductView.vue'
import { computed } from 'vue'
import type { ProductBrowserTableConfig } from '@/components/products/ProductsBrowserTable.vue'

interface Props {
  config?: DocumentBrowserDisplay
  productKey?: string
}

const { config, productKey } = defineProps<Props>()

const tableLayout = computed(() => {
  if (config?.browser?.layout) {
    return {
      preview: config.browser.layout.preview,
      type: 'table',
      headers: config.browser.layout.headers.map((header) => ({
        title: header.name,
        property:
          'productProperty' in header ? header.productProperty : undefined,
        attribute:
          'productAttribute' in header ? header.productAttribute : undefined,
      })),
    } as ProductBrowserTableConfig
  }
  return {
    preview: false,
    type: 'table',
    headers: [],
  } as ProductBrowserTableConfig
})
</script>
