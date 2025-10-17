<template>
  <ProductsBrowserView
    v-if="viewMode === 'browser'"
    :config="documentBrowserDisplay"
    :productId="props.productId"
  ></ProductsBrowserView>
  <ProductReportView
    v-else-if="viewMode === 'report'"
    :config="reportDisplay"
  ></ProductReportView>
  <span v-else class="text-center">
    Document display is not supported in this view mode.
  </span>
</template>

<script setup lang="ts">
import ProductsBrowserView from '@/components/products/ProductsBrowserView.vue'
import {
  DisplayCompose,
  DocumentBrowserDisplay,
  DocumentDisplaysConfig,
  isDocumentBrowser,
  isReportDisplay,
  ReportDisplay,
} from '@/lib/products/documentDisplay'
import { createTransformRequestFn } from '@/lib/requests/transformRequest'
import { configManager } from '@/services/application-config'
import {
  type DocumentDisplaysFilter,
  PiWebserviceProvider,
  type TopologyNode,
} from '@deltares/fews-pi-requests'
import { onMounted, ref, toValue, watchEffect } from 'vue'
import ProductReportView from './ProductReportView.vue'

interface Props {
  nodeId?: string | string[]
  topologyNode?: TopologyNode
  productId?: string
}

const props = defineProps<Props>()

const displayConfig =
  ref<(DocumentBrowserDisplay | ReportDisplay | DisplayCompose)[]>()
const documentBrowserDisplay = ref<DocumentBrowserDisplay>()
const reportDisplay = ref<ReportDisplay>()

const viewMode = ref<'browser' | 'report' | 'unsupported'>('browser')

onMounted(async () => {
  const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
  const provider = new PiWebserviceProvider(baseUrl, {
    transformRequestFn: createTransformRequestFn(),
  })
  const filter: DocumentDisplaysFilter = {}
  const response = (await provider.getDocumentDisplays(
    filter,
  )) as DocumentDisplaysConfig
  displayConfig.value = response.documentDisplays
})

watchEffect(() => {
  let documentDisplayId = toValue(props.topologyNode?.documentDisplayId)
  if (documentDisplayId === 'archiveProductId') {
    documentDisplayId = 'end_shift_form'
    console.warn(
      'Temporarily using overriding "archiveProductId" with "end_shift_form" for report display.',
      documentDisplayId,
    )
  }
  const documentDisplays = toValue(displayConfig.value)

  if (documentDisplayId && documentDisplays) {
    const documentDisplay = documentDisplays.find(
      (display) => display.id === documentDisplayId,
    )
    if (!documentDisplay) {
      viewMode.value = 'unsupported'
      console.warn(`Document display with ID ${documentDisplayId} not found.`)
      return
    }
    if (isDocumentBrowser(documentDisplay)) {
      // TODO: Get layout from config
      documentBrowserDisplay.value = documentDisplay
      viewMode.value = 'browser'
    } else if (isReportDisplay(documentDisplay)) {
      reportDisplay.value = documentDisplay
      viewMode.value = 'report'
    } else {
      documentBrowserDisplay.value = undefined
      reportDisplay.value = undefined
      viewMode.value = 'unsupported'
      console.warn(`Document display with ID ${documentDisplayId} not found.`)
    }
  } else {
    console.warn(
      'No document display ID provided or display config not loaded.',
    )
    viewMode.value = 'unsupported'
  }
})
</script>
