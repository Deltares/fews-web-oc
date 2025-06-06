<template>
  <div class="d-flex flex-row h-100 w-100">
    <ProductsBrowserTable
      :products="products"
      :config="tableLayout"
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
import { computed, ref, toValue, watchEffect } from 'vue'
import ProductsBrowserTable, {
  type ProductBrowserTableConfig,
} from '@/components/products/ProductsBrowserTable.vue'
import ReactiveIframe from '@/components/products/ReactiveIframe.vue'
import { getProductURL } from './productTools'
import { createTransformRequestFn } from '@/lib/requests/transformRequest'
import { ProductsMetaDataFilter } from '@deltares/fews-pi-requests'
import { useProducts } from '@/services/useProducts'
import { type DocumentBrowserDisplay } from '@/lib/products/documentDisplay'
import { DateTime } from 'luxon'
import {
  type IntervalItem,
  periodToIntervalItem,
} from '@/lib/TimeControl/interval'
import { layout } from '@/assets/browserLayout.json'
import { configManager } from '@/services/application-config'

interface Props {
  config?: DocumentBrowserDisplay
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
const tableLayout = ref<ProductBrowserTableConfig>({
  type: 'table',
  headers: [],
} as ProductBrowserTableConfig)
const viewPeriod = ref<IntervalItem>({})

const filter = computed(() => {
  if (
    viewPeriod.value.start === undefined ||
    viewPeriod.value.end === undefined
  ) {
    return {}
  }
  const startForecastTime = DateTime.now()
    .plus(viewPeriod.value.start)
    .toUTC()
    .toISO({ suppressMilliseconds: true })
  const endForecastTime = DateTime.now()
    .plus(viewPeriod.value.end)
    .toUTC()
    .toISO({ suppressMilliseconds: true })

  const result: ProductsMetaDataFilter = {
    versionKey: ['productId'],
    startForecastTime,
    endForecastTime,
  }
  return result
})

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const { products, getProductByKey } = useProducts(baseUrl, filter)

watchEffect(() => {
  const documentDisplay = toValue(props.config)
  if (documentDisplay) {
    viewPeriod.value = periodToIntervalItem(documentDisplay.relativeViewPeriod)
    tableLayout.value = layout
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
    const url = getProductURL(baseUrl, productMetaData)
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
