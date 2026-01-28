<template>
  <div class="d-flex flex-row h-100 w-100">
    <v-navigation-drawer v-model="drawer" :width="600">
      <ProductsBrowserTable
        v-if="tableConfig"
        :products="filteredProducts"
        :config="tableConfig"
        class="w-100 h-100"
        :productKey="productKey"
        @refresh="fetchProducts()"
      >
        <template #footer>
          <v-list-item density="compact">
            Last updated: {{ toHumanReadableDateTime(lastUpdated) }}
            <template #append>
              <v-btn
                class="refresh-container"
                variant="text"
                icon
                @click="fetchProducts()"
              >
                <v-icon>mdi-refresh</v-icon>
              </v-btn>
            </template>
          </v-list-item>
        </template>
        <template #prepend="{ headers }">
          <UploadProductForm
            v-if="showUploadProductForm"
            :type="canUpload ? 'upload' : 'new'"
            :sourceId="sourceId"
            :areaId="areaId"
            :author="userName"
            :viewPeriod="viewPeriod"
            :compose="compose"
            @saved="fetchProducts()"
            @close="showUploadProductForm = false"
          />

          <tr v-else-if="canUpload">
            <td :colspan="headers[0].length + 3" class="ps-4">
              <v-btn
                prepend-icon="mdi-plus"
                size="small"
                variant="tonal"
                @click="showUploadProductForm = true"
              >
                Upload</v-btn
              >
            </td>
          </tr>
          <tr v-else-if="canCreateNew">
            <td :colspan="headers[0].length + 3" class="ps-4">
              <v-btn
                prepend-icon="mdi-plus"
                size="small"
                variant="tonal"
                @click="showUploadProductForm = true"
                >New</v-btn
              >
            </td>
          </tr>
        </template>
      </ProductsBrowserTable>
    </v-navigation-drawer>
    <div class="flex-1-1 h-100 flex-column position-relative">
      <EditReport
        v-if="isEditing"
        v-model="htmlContent"
        @save="onSave"
        @close="onClose"
      />
      <template v-else>
        <v-toolbar density="compact" absolute>
          <v-btn
            :icon="drawer ? 'mdi-menu-open' : 'mdi-menu-close'"
            @click="drawer = !drawer"
          ></v-btn>
          <template v-if="viewMode === 'html' && editPermissions">
            <v-btn
              color="primary"
              prepend-icon="mdi-pencil"
              variant="flat"
              @click="isEditing = !isEditing"
              >edit</v-btn
            >
            <v-menu location="bottom left">
              <template #activator="{ props }">
                <v-btn
                  icon="mdi-dots-horizontal"
                  variant="text"
                  v-bind="props"
                  :loading="actionIsActive"
                />
              </template>
              <v-list density="compact">
                <v-list-item
                  v-if="viewMode === 'html'"
                  prepend-icon="mdi-email"
                  title="Open in Email Client..."
                  @click="
                    openEmailClient(
                      `${selectedProduct.attributes.name}: ${selectedProduct.timeZero}`,
                      htmlContent,
                    )
                  "
                />
                <v-list-item
                  v-for="action in logDisplay?.logDissemination
                    ?.disseminationActions"
                  :prepend-icon="action.iconId"
                  :title="action.description"
                  @click="runDisseminateAction(htmlContent, action)"
                >
                </v-list-item>
              </v-list>
            </v-menu>
          </template>
          <v-spacer />
          <v-toolbar-items>
            <v-btn
              icon="mdi-download"
              :disabled="!selectedProduct"
              @click="downloadProduct()"
            />
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
            class="products-browser-view__item"
          ></ReactiveIframe>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import ProductsBrowserTable, {
  type ProductBrowserTableConfig,
} from '@/components/products/ProductsBrowserTable.vue'
import UploadProductForm from '@/components/products/UploadProductForm.vue'
import ReactiveIframe from '@/components/products/ReactiveIframe.vue'
import { getProductURL } from './productTools'
import { createTransformRequestFn } from '@/lib/requests/transformRequest'
import {
  DocumentRelativeViewPeriod,
  type LogDisplayDisseminationAction,
  type LogDisplayLogsActionRequest,
  PiWebserviceProvider,
} from '@deltares/fews-pi-requests'
import { useProducts } from '@/services/useProducts'
import type {
  ArchiveProduct,
  ArchiveProductSet,
  DocumentCompose,
} from '@/lib/products/documentDisplay'
import { toHumanReadableDateTime } from '@/lib/date'
import { getFileExtension, getViewMode } from '@/lib/products'
import {
  type IntervalItem,
  periodToIntervalItem,
} from '@/lib/TimeControl/interval'
import { configManager } from '@/services/application-config'
import EditReport from '@/components/reports/EditReport.vue'
import DOMPurify from 'dompurify'
import { ProductMetaDataType } from '@/services/useProducts/types'
import { useCurrentUser } from '@/services/useCurrentUser'
import { postProduct } from '@/lib/products/requests'
import { useLogDisplay } from '@/services/useLogDisplay'
import { convert } from 'html-to-text'
import { clickDownloadUrl } from '@/lib/download'

const LOG_DISPLAY_ID = 'email_reports'

interface Props {
  tableConfig?: ProductBrowserTableConfig
  archiveProducts?: ArchiveProduct[]
  archiveProductSets?: ArchiveProductSet[]
  relativeViewPeriod?: DocumentRelativeViewPeriod
  editPermissions?: boolean
  showAllVersions?: boolean
  productKey?: string
  compose?: DocumentCompose[]
}

const {
  tableConfig,
  archiveProducts = [],
  archiveProductSets = [],
  relativeViewPeriod,
  editPermissions = false,
  productKey,
  showAllVersions = false,
  compose = [],
} = defineProps<Props>()
const src = ref('')
const viewMode = ref('')

const selected = ref(0) // Example timeZero
const selectedProduct = computed(() => {
  return filteredProducts.value[selected.value]
})

const viewPeriod = ref<IntervalItem>({})
const htmlContent = ref('')
const isEditing = ref(false)
const drawer = ref(true)

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const actionIsActive = ref(false) // Flag to indicate if a dissemination action is active
const { logDisplay } = useLogDisplay(baseUrl, () => LOG_DISPLAY_ID)

const canUpload = computed(() => archiveProductSets.length > 0)

const showUploadProductForm = ref(false)

const { userName } = useCurrentUser()

const canCreateNew = computed(() => {
  return compose.length > 0
})

const archiveProductConfig = computed(() => {
  if (archiveProducts.length) return archiveProducts
  if (archiveProductSets.length) return archiveProductSets
  return []
})

const sourceId = computed(() => {
  if (archiveProducts.length) return archiveProducts[0].sourceId || ''
  return archiveProductSets[0].constraints?.sourceId || 'weboc'
})
const areaId = computed(() => {
  if (archiveProducts.length) return archiveProducts[0].areaId || ''
  return archiveProductSets[0].constraints?.areaId || 'weboc'
})

const { products, getProductByKey, fetchProducts, lastUpdated } = useProducts(
  baseUrl,
  viewPeriod,
  archiveProductConfig,
)

const filteredProducts = computed(() => {
  if (showAllVersions) {
    return products.value.toReversed()
  }
  const latestMap = new Map<string, ProductMetaDataType>()
  for (const product of products.value) {
    const existing = latestMap.get(product.timeZero)
    if (!existing || product.version > existing.version) {
      latestMap.set(product.timeZero, product)
    }
  }
  return Array.from(latestMap.values()).toReversed()
})

watchEffect(() => {
  if (relativeViewPeriod) {
    viewPeriod.value = periodToIntervalItem(relativeViewPeriod)
  }
})

watchEffect(() => {
  if (productKey) {
    const productMetaData = getProductByKey(productKey)
    if (productMetaData) {
      selected.value = filteredProducts.value.findIndex(
        (p) => p.key === productMetaData.key,
      )
    } else {
      console.warn(`Product with Key ${productKey} not found.`)
      selected.value = -1
    }
  } else {
    selected.value = -1
  }
})

watchEffect(async () => {
  if (selected.value > -1) {
    const productMetaData = filteredProducts.value[selected.value]
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
    src.value = urlObject + urlFragments
  } else {
    src.value = ''
  }
})

function downloadProduct() {
  if (!src.value) return
  if (!selectedProduct.value) return

  const productUrl = getProductURL(baseUrl, selectedProduct.value)
  const fileExtension = getFileExtension(productUrl)
  const fileName = `${selectedProduct.value.attributes.name}.${fileExtension}`
  clickDownloadUrl(src.value, fileName)
}

async function onSave() {
  const piUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
  const archiveUrl = `${piUrl}rest/fewspiservice/v1/archive/`
  const metaData = selectedProduct.value
  const fileName =
    metaData.relativePathProducts[0].split('/').pop() ?? 'unknown'
  try {
    await postProduct(
      archiveUrl,
      metaData.areaId,
      metaData.sourceId,
      metaData.timeZero,
      htmlContent.value,
      fileName,
      metaData.attributes,
    )
    await fetchProducts()
  } catch (error) {
    console.error('Error saving report:', error)
    return
  } finally {
    isEditing.value = false
  }
}

function onClose() {
  isEditing.value = false
}

async function runDisseminateAction(
  htmlContent: string,
  action: LogDisplayDisseminationAction,
) {
  const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
  const provider = new PiWebserviceProvider(baseUrl, {
    transformRequestFn: createTransformRequestFn(),
  })

  const textContent = convert(htmlContent, {
    wordwrap: 130,
    selectors: [
      { selector: 'img', format: 'skip' }, // Skip images
      { selector: 'iframe', format: 'skip' }, // Skip iframes
    ],
  })

  const request: LogDisplayLogsActionRequest = {
    logDisplayId: LOG_DISPLAY_ID,
    actionId: action.id,
    logMessage: textContent,
    logLevel: 'INFO',
  }

  try {
    actionIsActive.value = true
    await provider.postLogDisplaysAction(request)
  } catch (error) {
    console.error('Error occurred while executing runDisseminateAction:', error)
  } finally {
    actionIsActive.value = false
  }
}

function openEmailClient(subject: string, content: string) {
  const textContent = convert(content, {
    wordwrap: 130,
    selectors: [
      { selector: 'img', format: 'skip' }, // Skip images
      { selector: 'iframe', format: 'skip' }, // Skip iframes
    ],
  })
  const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(textContent)}`
  window.location.href = mailtoLink
}
</script>

<style scoped>
.products-browser-view__canvas {
  position: absolute;
  top: 48px;
  bottom: 0;
  background-color: #e0e0e0;
}

.products-browser-view__item {
  width: 1060px;
  margin: 20px auto;
  background-color: white;
}

img {
  box-sizing: border-box;
  margin: auto;
  box-shadow: 0 0.5mm 2mm rgba(0, 0, 0, 0.3);
  position: absolute;
  object-fit: contain;
  left: 20px;
  top: 20px;
  max-width: calc(100% - 40px);
  max-height: calc(100% - 40px);
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
</style>
