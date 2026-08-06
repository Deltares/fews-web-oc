<template>
  <div class="d-flex flex-row h-100 w-100">
    <v-navigation-drawer v-model="drawer" :width="600">
      <ProductsBrowserTable
        v-if="tableConfig"
        :products="filteredProducts"
        :config="tableConfig"
        class="w-100 h-100"
        :productKey="productKey"
        :loading="isLoading"
        @refresh="refresh()"
      >
        <template #footer>
          <v-divider />
          <v-list-item density="compact">
            Last updated: {{ toHumanReadableDateTime(lastUpdated) }}
            <template #append>
              <v-btn
                icon="mdi-refresh"
                :loading="isLoading"
                @click="refresh()"
              />
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
            class="no-hover"
            @saved="refresh()"
            @close="showUploadProductForm = false"
          />

          <tr v-else-if="canUpload || canCreateNew" class="no-hover">
            <td :colspan="headers[0].length + 3" class="ps-4 py-2">
              <v-btn
                prepend-icon="mdi-plus"
                size="small"
                variant="tonal"
                @click="showUploadProductForm = true"
              >
                {{ canUpload ? 'Upload' : 'New' }}
              </v-btn>
            </td>
          </tr>
        </template>
      </ProductsBrowserTable>
    </v-navigation-drawer>
    <div class="flex-1-1 h-100 w-100 flex-column position-relative">
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
              :disabled="!selectedProduct"
              @click="isEditing = !isEditing"
            >
              edit
            </v-btn>
            <v-menu location="bottom left">
              <template #activator="{ props }">
                <v-btn
                  icon
                  size="small"
                  v-bind="props"
                  :loading="actionIsActive"
                >
                  <v-icon size="small">mdi-dots-horizontal</v-icon>
                </v-btn>
              </template>
              <v-list density="compact">
                <v-list-item
                  v-if="viewMode === 'html' && selectedProduct"
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
          title="Document Viewer"
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
import { computed, ref, watch, watchEffect } from 'vue'
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
import { getContentType, postProduct } from '@/lib/products/requests'
import { useLogDisplay } from '@/services/useLogDisplay'
import { convert } from 'html-to-text'
import { clickDownloadUrl } from '@/lib/download'
import { useRoute, useRouter } from 'vue-router'
import { isLocalProduct } from '@/lib/products/local'

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

const selectedProduct = computed(() =>
  filteredProducts.value.find((p) => p.key === productKey),
)

const route = useRoute()
const router = useRouter()
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

const { products, refresh, lastUpdated, isLoading } = useProducts(
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

watch(
  () => filteredProducts.value,
  () => {
    if (productKey) return
    if (!filteredProducts.value.length) return

    const firstProductMetaData = filteredProducts.value[0]
    router.push({
      name: route.name,
      params: {
        ...route.params,
        productKey: firstProductMetaData.key,
      },
    })
  },
)

watch(selectedProduct, async (prevProduct, newProduct) => {
  if (prevProduct?.key !== newProduct?.key) {
    src.value = ''
    htmlContent.value = ''
  }

  if (isLocalProduct(selectedProduct.value)) {
    const fileName =
      selectedProduct.value?.relativePathProducts[0].split('/').pop() ??
      'unknown'
    const content = selectedProduct.value?.relativePathProducts[1] ?? ''
    const file = selectedProduct.value?.relativePathProducts[2] ?? ''

    if (content) {
      const file = new File([String(content)], fileName, {
        type: getContentType(content),
      })
      src.value = URL.createObjectURL(file)
      viewMode.value = 'html'
      htmlContent.value = sanitizeHtmlContent(content)
      return
    }

    if (file) {
      src.value = file
      viewMode.value = getViewMode(getFileExtension(fileName))
      htmlContent.value = ''
      return
    }

    return
  }

  const url = getProductURL(baseUrl, selectedProduct.value)
  if (!url) {
    src.value = ''
    viewMode.value = ''
    return
  }

  const extension = getFileExtension(url)
  const currentViewMode = getViewMode(extension)
  const urlFragments =
    currentViewMode === 'pdf' ? '#view=FitH&zoom=page-width' : ''

  const transformRequest = createTransformRequestFn()
  const request = await transformRequest(new Request(url, {}))
  const response = await fetch(request)
  if (currentViewMode === 'html') {
    const clone = response.clone()
    htmlContent.value = sanitizeHtmlContent(await clone.text())
  } else {
    htmlContent.value = ''
  }
  const urlObject = URL.createObjectURL(await response.blob())
  viewMode.value = currentViewMode
  src.value = urlObject + urlFragments
})

function sanitizeHtmlContent(content: string) {
  return DOMPurify.sanitize(content, { USE_PROFILES: { html: true } })
}

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
  if (!metaData) {
    console.error('No product selected for saving')
    return
  }
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
    await refresh()
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
  globalThis.location.href = mailtoLink
}
</script>

<style scoped>
.products-browser-view__canvas {
  position: absolute;
  top: 48px;
  bottom: 0;
  background-color: #e0e0e0;
  padding: 20px;
}

.products-browser-view__item {
  width: 1060px;
  margin: 0 auto;
  background-color: white;
}

img {
  box-sizing: border-box;
  margin: auto;
  box-shadow: 0 0.5mm 2mm rgba(0, 0, 0, 0.3);
  position: absolute;
  object-fit: contain;
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

.no-hover {
  --v-hover-opacity: 0 !important;
  background-color: transparent !important;
}
</style>
