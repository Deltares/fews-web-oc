<template>
  <div class="d-flex flex-row h-100 w-100">
    <ProductsBrowserTable
      :products="filteredProducts"
      :template="mostRecentTemplate"
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
      <template #prepend="{ headers }">
        <tr v-if="canUpload">
          <td :colspan="headers[0].length + 3" class="ps-4">
            <v-btn
              prepend-icon="mdi-plus"
              size="small"
              variant="tonal"
              >Upload</v-btn
            >
          </td>
        </tr>
        <tr v-else-if="canCreateNew">
          <td :colspan="headers[0].length + 3" class="ps-4">
            <v-btn
              prepend-icon="mdi-plus"
              size="small"
              variant="tonal"
              >New</v-btn
            >
          </td>
        </tr>
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
                    <v-list-item
                      v-for="(item, _) in versions"
                      :key="item.key"
                      :title="item.timeZero"
                      :subtitle="`Version ${item.version}`"
                      @click="
                        router.replace({
                          name: 'TopologyDocumentDisplay',
                          params: {
                            productId: item.key,
                          },
                        })
                      "
                    />
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
import { ProductMetaDataType } from '@/services/useProducts/types'
import { useRouter } from 'vue-router'

interface Props {
  config?: DocumentBrowserDisplay
  productId?: string
}

const { config, productId } = defineProps<Props>()
const router = useRouter()
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

const sourceId = computed(() => {
  if (config?.browser?.archiveProducts?.length)
    return config?.browser?.archiveProducts[0].sourceId || ''
  return config?.browser?.archiveProductSets[0].constraints?.sourceId || 'weboc'
})
const areaId = computed(() => {
  if (config?.browser?.archiveProducts?.length)
    return config?.browser?.archiveProducts[0].areaId || ''
  return (
    config?.browser?.archiveProductSets[0].constraints?.areaId || 'products'
  )
})

const archiveProductSets = computed(() => {
  return config?.browser?.archiveProductSets ?? []
})

const archiveProducts = computed(() => {
  return config?.browser?.archiveProducts ?? []
})

const canUpload = computed(() => {
  return archiveProductSets.value.length > 0
})

const canCreateNew = computed(() => {
  return archiveProducts.value.length > 0
})

const sourceId = computed(() => {
  if (archiveProducts.value.length)
    return archiveProducts.value[0].sourceId || ''
  return archiveProductSets.value[0].constraints?.sourceId || 'weboc'
})
const areaId = computed(() => {
  if (archiveProducts.value.length) return archiveProducts.value[0].areaId || ''
  return archiveProductSets.value[0].constraints?.areaId || 'weboc'
})

const { products, getProductByKey, refresh, lastUpdated, mostRecentTemplate } =
  useProducts(
    baseUrl,
    filter,
    sourceId,
    areaId,
    archiveProductSets,
    archiveProducts,
  )

const filteredProductsMap = computed(() => {
  const map = new Map<string, ProductMetaDataType[]>()
  for (const product of products.value) {
    if (!product.attributes.productId) {
      continue
    }
    const existing = map.get(product.attributes.productId)
    if (existing) {
      existing.push(product)
    } else {
      map.set(product.attributes.productId, [product])
    }
  }
  // Sort each array by version
  for (const [key, productArray] of map.entries()) {
    productArray.sort((a, b) => +b.version - +a.version)
    map.set(key, productArray)
  }
  return map
})

const filteredProducts = computed(() => {
  // return the latest version of each product in the map
  return Array.from(filteredProductsMap.value.values()).map(
    (products) => products[0],
  )
})

const versions = computed(() => {
  if (!productId) {
    return []
  }
  return (
    filteredProductsMap.value.get(
      getProductByKey(productId)?.attributes.productId ?? '',
    ) ?? []
  )
})

watchEffect(() => {
  console.log('Products:', productId)
  console.log('Filtered products map:', filteredProductsMap.value)
})

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
      currentViewMode === 'pdf' ? '#view=FitH&zoom=page-width' : ''

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
