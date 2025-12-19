<template>
  <span v-if="isLoading" class="text-center"></span>
  <ProductsBrowserView
    v-else-if="isDocumentBrowser(config)"
    :config="config"
    :productKey="productKey"
  />
  <ProductReportView v-else-if="isReportDisplay(config)" :config="config" />
  <ProductsComposeView v-else-if="isComposeDisplay(config)" class="overflow-auto"
    :config="config"
    :productKey="productKey"
  />
  <span v-else class="text-center">
    Document display is not supported in this view mode.
  </span>
</template>

<script setup lang="ts">
import ProductsBrowserView from '@/components/products/ProductsBrowserView.vue'
import ProductsComposeView from '@/components/products/ProductsComposeView.vue'
import {
  isDocumentBrowser,
  isReportDisplay,
  isComposeDisplay,
} from '@/lib/products/documentDisplay'
import { type TopologyNode } from '@deltares/fews-pi-requests'
import ProductReportView from './ProductReportView.vue'
import { useDocumentDisplay } from '@/services/useDocumentDisplay'

interface Props {
  nodeId?: string | string[]
  topologyNode?: TopologyNode
  productKey?: string
}

const props = defineProps<Props>()

const { documentDisplay: config, isLoading } = useDocumentDisplay(
  () => props.topologyNode?.documentDisplayId,
)
</script>
