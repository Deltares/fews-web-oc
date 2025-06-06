<template>
  <ProductsBrowserView
    v-if="viewMode === 'browser'"
    :config="config"
  ></ProductsBrowserView>
  <ProductReportView
    v-else-if="viewMode === 'report'"
    :config="config"
  ></ProductReportView>
  <span v-else class="text-center">
    Document display is not supported in this view mode.
  </span>
</template>

<script setup lang="ts">
import ProductsBrowserView from '@/components/products/ProductsBrowserView.vue'
import {
  DocumentBrowserDisplay,
  DocumentDisplaysConfig,
  isDocumentBrowser,
  isReportDisplay,
  ReportDisplay,
} from '@/lib/products/documentDisplay'
import { createTransformRequestFn } from '@/lib/requests/transformRequest'
import { configManager } from '@/services/application-config'
import { TopologyNode } from '@deltares/fews-pi-requests'
import { onMounted, ref, toValue, watchEffect } from 'vue'
import ProductReportView from './ProductReportView.vue'

interface Props {
  nodeId?: string | string[]
  topologyNode?: TopologyNode
  productId?: string
}

const props = defineProps<Props>()

const displayConfig = ref<(DocumentBrowserDisplay | ReportDisplay)[]>()
const config = ref<DocumentBrowserDisplay | ReportDisplay>()
const viewMode = ref<'browser' | 'report' | 'unsupported'>('browser')

onMounted(async () => {
  const transformRequest = createTransformRequestFn()
  const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
  const url = `${baseUrl}rest/fewspiservice/v1/documentdisplays`
  const request = await transformRequest(new Request(url, {}))
  const reponse = await fetch(request)
  const config = (await reponse.json()) as DocumentDisplaysConfig
  displayConfig.value = config.documentDisplays
})

watchEffect(() => {
  let documentDisplayId = toValue(props.topologyNode?.documentDisplayId)
  console.log('Document display ID from props:', documentDisplayId)
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
      config.value = documentDisplay
      viewMode.value = 'browser'
    } else if (isReportDisplay(documentDisplay)) {
      config.value = documentDisplay
      viewMode.value = 'report'
    } else {
      config.value = undefined
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
