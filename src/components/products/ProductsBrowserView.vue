<template>
  <div class="d-flex flex-row h-100 w-100">
    <ProductsBrowserTable
      :products="products"
      :config="tableLayout"
      class="product-browser__table"
      :productId="productId"
      :areaId="areaId"
      :sourceId="sourceId"
      @refresh="refresh()"
    >
      <template #footer>
        <v-list-item density="compact">
          Last updated: {{ toHumanReadableDate(lastUpdated) }}
          <template #append>
            <v-btn
              class="refresh-container"
              variant="text"
              icon
              @click="refresh()"
            >
              <v-icon>mdi-refresh</v-icon>
            </v-btn>
          </template>
        </v-list-item>
      </template>
    </ProductsBrowserTable>
    <div class="flex-1-1 h-100 flex-column position-relative">
      <EditReport v-if="isEditing" v-model="htmlContent" @save="onSave" />
      <template v-else>
        <v-toolbar density="compact" absolute>
          <v-btn
            v-if="viewMode === 'html'"
            color="primary"
            prepend-icon="mdi-pencil"
            variant="flat"
            @click="isEditing = !isEditing"
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
          v-if="viewMode === 'iframe' || viewMode === 'pdf'"
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
      </template>
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
import { toHumanReadableDate } from '@/lib/date'
import { getFileExtension, getViewMode } from '@/lib/products'
import {
  type IntervalItem,
  intervalToFewsPiDateRange,
  periodToIntervalItem,
} from '@/lib/TimeControl/interval'
import { configManager } from '@/services/application-config'
import EditReport from '@/components/reports/EditReport.vue'
import DOMPurify from 'dompurify'

interface Props {
  config?: DocumentBrowserDisplay
  productId?: string
}

const { config, productId } = defineProps<Props>()
const src = ref('')
const viewMode = ref('')
const timeZero = ref('')
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
const viewPeriod = ref<IntervalItem>({})
const htmlContent = ref('')
const isEditing = ref(false)

const filter = computed(() => {
  if (
    viewPeriod.value.start === undefined ||
    viewPeriod.value.end === undefined
  ) {
    return {}
  }

  const [startForecastTime, endForecastTime] = intervalToFewsPiDateRange(
    viewPeriod.value,
  )

  const result: ProductsMetaDataFilter = {
    versionKey: ['productId'],
    startForecastTime,
    endForecastTime,
  }
  return result
})

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')

const sourceId = computed(
  () => config?.browser?.archiveProductSets[0].constraints?.sourceId || 'weboc',
)
const areaId = computed(
  () =>
    config?.browser?.archiveProductSets[0].constraints?.areaId || 'products',
)

const archiveProductSets = computed(() => {
  return config?.browser?.archiveProductSets ?? []
})

const { products, getProductByKey, refresh, lastUpdated } = useProducts(
  baseUrl,
  filter,
  sourceId,
  areaId,
  archiveProductSets,
)

watchEffect(() => {
  const documentDisplay = toValue(config)
  if (documentDisplay) {
    viewPeriod.value = periodToIntervalItem(documentDisplay.relativeViewPeriod)
  }
})

watchEffect(async () => {
  if (productId) {
    const productMetaData = getProductByKey(productId)
    if (!productMetaData) {
      src.value = ''
      timeZero.value = ''
      return
    }
    const url = getProductURL(baseUrl, productMetaData)
    const extension = getFileExtension(url)
    const currentViewMode = getViewMode(extension)
    const urlFragments =
      currentViewMode === 'pdf' ? '#view=FitH' : ''

    const transformRequest = createTransformRequestFn()
    const request = await transformRequest(new Request(url, {}))
    const response = await fetch(request)
    if (currentViewMode === 'html') {
      const clone = response.clone()
      htmlContent.value = DOMPurify.sanitize(await clone.text(), {
        USE_PROFILES: { html: true },
      })
    } else {
      htmlContent.value = ''
    }

    const urlObject = URL.createObjectURL(await response.blob())
    viewMode.value = currentViewMode
    timeZero.value = productMetaData.timeZero
    src.value = urlObject + urlFragments
  } else {
    src.value = ''
  }
})

function onSave() {
  isEditing.value = false
}
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
