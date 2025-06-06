<template>
  <div class="d-flex flex-row h-100 w-100">
    <ProductsBrowserTable
      :products="products"
      :config="viewConfig"
      class="product-browser__table"
    />
    <div class="flex-1-1 h-100 flex-column position-relative">
      <v-toolbar density="compact" absolute>
        <v-btn
          v-if="viewMode === 'html'"
          color="primary"
          prepend-icon="mdi-pencil"
          variant="flat"
          >edit</v-btn
        >
        <v-spacer />
        <v-toolbar-items>
          <v-btn append-icon="mdi-chevron-down" class="me-4">
            {{ timeZero }}
            <v-menu activator="parent">
              <v-list density="compact">
                <v-item-group>
                  <v-list-item> {{ timeZero }} </v-list-item>
                </v-item-group>
              </v-list>
            </v-menu>
          </v-btn>
        </v-toolbar-items>
      </v-toolbar>
      <iframe
        v-if="viewMode === 'iframe'"
        :src="src"
        class="pdf-iframe"
      ></iframe>
      <div v-else class="products-browser-view__canvas overflow-y-auto w-100">
        <img v-if="viewMode === 'img'" :src="src" />
        <ReactiveIframe
          v-else-if="viewMode === 'html'"
          :src="src"
        ></ReactiveIframe>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, toValue, watchEffect } from 'vue'
import ProductsBrowserTable, {
  type ProductBrowserTableConfig,
} from '@/components/products/ProductsBrowserTable.vue'
import ReactiveIframe from '@/components/products/ReactiveIframe.vue'
import { getProductURL } from './productTools'
import { createTransformRequestFn } from '@/lib/requests/transformRequest'
import {
  ProductsMetaDataFilter,
  TopologyNode,
} from '@deltares/fews-pi-requests'
import { useProducts } from '@/services/useProducts'
import { getResourcesStaticUrl } from '@/lib/fews-config'
import {
  isDocumentBrowser,
  type DocumentBrowserDisplay,
  type ReportDisplay,
  type DocumentDisplaysConfig,
} from '@/lib/products/documentDisplay'
import { DateTime, Duration } from 'luxon'

interface Props {
  nodeId?: string | string[]
  topologyNode: TopologyNode
  productId?: string
}

function getFileExtension(url: string): string {
  const urlParts = url.split('.')
  return urlParts[urlParts.length - 1]
}

function getViewMode(extension: string): string {
  switch (extension) {
    case 'html':
      return 'html'
    case 'png':
    case 'jpg':
    case 'jpeg':
      return 'img'
    case 'pdf':
    default:
      return 'iframe'
  }
}

const props = defineProps<Props>()
const src = ref('')
const viewMode = ref('')
const timeZero = ref('')
const displayConfig = ref<(DocumentBrowserDisplay | ReportDisplay)[]>()
const viewConfig = ref<ProductBrowserTableConfig>({
  type: 'table',
  headers: [],
} as ProductBrowserTableConfig)
const viewPeriod = ref<Duration[]>([])

const filter = computed(() => {
  const startForecastTime = DateTime.now()
    .plus(viewPeriod.value[0])
    .toUTC()
    .toISO({ suppressMilliseconds: true })
  const endForecastTime = DateTime.now()
    .plus(viewPeriod.value[1])
    .toUTC()
    .toISO({ suppressMilliseconds: true })

  const result: ProductsMetaDataFilter = {
    versionKey: ['archiveProductId'],
    startForecastTime,
    endForecastTime,
  }
  return result
})

const { products, getProductByKey } = useProducts(filter)

onMounted(async () => {
  const transformRequest = createTransformRequestFn()
  const url = getResourcesStaticUrl('documentDisplays.json').toString()
  const request = await transformRequest(new Request(url, {}))
  const reponse = await fetch(request)
  const config = (await reponse.json()) as DocumentDisplaysConfig
  displayConfig.value = config.documentDisplays
})

watchEffect(() => {
  const documentDisplayId = toValue(props.topologyNode?.documentDisplayId)
  const documentDisplays = toValue(displayConfig.value)

  if (documentDisplayId && documentDisplays) {
    const documentDisplay = documentDisplays.find(
      (display) => display.id === documentDisplayId,
    )
    if (!documentDisplay) {
      return
    }

    viewPeriod.value = documentDisplay.relativeViewPeriod
      .split('/')
      .map((d) => Duration.fromISO(d))

    if (isDocumentBrowser(documentDisplay)) {
      viewConfig.value = documentDisplay.documentBrowser.layout
    } else {
      console.warn(`Document display with ID ${documentDisplayId} not found.`)
    }
  } else {
    console.warn(
      'No document display ID provided or display config not loaded.',
    )
  }
})

watchEffect(async () => {
  if (props.productId) {
    const productMetaData = getProductByKey(props.productId)
    if (!productMetaData) {
      src.value = ''
      timeZero.value = ''
      return
    }
    const url = getProductURL(productMetaData)
    const extension = getFileExtension(url)

    viewMode.value = getViewMode(extension)

    const transformRequest = createTransformRequestFn()
    const request = await transformRequest(new Request(url, {}))
    const reponse = await fetch(request)
    const urlObject = URL.createObjectURL(await reponse.blob())

    timeZero.value = productMetaData.timeZero
    src.value = urlObject
  } else {
    src.value = ''
  }
})
</script>

<style scoped>
.products-browser-view__canvas {
  position: absolute;
  top: 48px;
  bottom: 0;
  background-color: #e0e0e0;
}

img {
  box-sizing: border-box;
  margin: auto;
  box-shadow: 0 0.5mm 2mm rgba(0, 0, 0, 0.3);
  position: absolute;
  left: 20px;
  top: 20px;
}

.pdf-iframe {
  position: absolute;
  width: 100%;
  top: 48px;
  height: calc(100% - 48px);
  border: none;
  box-sizing: border-box;
  background-color: white;
  box-shadow: 0 0.5mm 2mm rgba(0, 0, 0, 0.3);
}

.product-browser__table {
  width: 600px;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
}
</style>
