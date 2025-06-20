<template>
  <div class="d-flex flex-row h-100 w-100">
    <ProductsBrowserTable
      :products="filteredProducts"
      :config="tableLayout"
      class="product-browser__table"
      :productId="productId"
      :areaId="areaId"
      :sourceId="sourceId"
      @refresh="fetchProducts()"
    >
      <template #footer>
        <v-list-item density="compact">
          Last updated: {{ toHumanReadableDate(lastUpdated) }}
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
        <template v-if="uploadData">
          <tr>
            <td colspan="100%" class="py-2">
              <v-card flat>
                <v-form v-model="uploadIsValid">
                  <v-container>
                    <v-row v-if="canUpload">
                      <v-col cols="12">
                        <v-file-input
                          v-model="file"
                          :height="10"
                          label="Upload file"
                          hide-details="auto"
                          variant="plain"
                          density="compact"
                          :rules="[(v) => !!v || 'File is required']"
                          accept=".html,.pdf,.png,.jpg,.jpeg,.gif"
                        >
                        </v-file-input>
                      </v-col>
                    </v-row>
                    <v-row>
                      <v-col cols="12">
                        <v-text-field
                          v-model="uploadData.name"
                          label="Product Name"
                          variant="outlined"
                          :rules="[(v) => !!v || 'Product name is required']"
                          hide-details
                          density="compact"
                        ></v-text-field>
                      </v-col>
                    </v-row>
                    <v-row>
                      <v-col cols="12">
                        <v-text-field
                          v-model="uploadData.author"
                          label="Author"
                          variant="outlined"
                          :rules="[(v) => !!v || 'Author name is required']"
                          hide-details
                          density="compact"
                        ></v-text-field>
                      </v-col>
                    </v-row>
                    <v-row v-if="uploadData.timeZero">
                      <v-col cols="12">
                        <v-text-field
                          readonly
                          v-model="uploadData.timeZero"
                          label="Time"
                          variant="outlined"
                          :rules="[(v) => !!v || 'Author name is required']"
                          hide-details
                          density="compact"
                        ></v-text-field>
                      </v-col>
                    </v-row>
                  </v-container>
                </v-form>
                <v-card-actions>
                  <v-spacer />
                  <v-btn variant="flat" size="small" @click="resetUpload"
                    >Cancel</v-btn
                  >
                  <v-btn
                    variant="flat"
                    color="primary"
                    size="small"
                    :disabled="!uploadIsValid"
                    @click="uploadProduct()"
                    >Save</v-btn
                  >
                </v-card-actions>
              </v-card>
            </td>
          </tr>
        </template>
        <tr v-else-if="canUpload">
          <td :colspan="headers[0].length + 3" class="ps-4">
            <v-btn
              prepend-icon="mdi-plus"
              size="small"
              variant="tonal"
              @click="newUploadFile"
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
              @click="newProduct"
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
          <template v-if="viewMode === 'html'">
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
            <v-btn
              append-icon="mdi-chevron-down"
              variant="text"
              class="text-start"
            >
              <v-list-item
                class="ps-0 pe-2"
                :title="selectedProduct?.timeZero"
                :subtitle="`Version ${selectedProduct?.version}`"
              >
              </v-list-item>
              <v-menu activator="parent">
                <v-list density="compact">
                  <v-list-item
                    v-for="(item, index) in filteredProducts"
                    :key="item.key"
                    :title="item.timeZero"
                    :subtitle="`Version ${item.version}`"
                    @click="selected = index"
                  >
                  </v-list-item>
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
import { computed, ref, toValue, watch, watchEffect } from 'vue'
import ProductsBrowserTable, {
  type ProductBrowserTableConfig,
} from '@/components/products/ProductsBrowserTable.vue'
import ReactiveIframe from '@/components/products/ReactiveIframe.vue'
import { getProductURL } from './productTools'
import { createTransformRequestFn } from '@/lib/requests/transformRequest'
import {
  type LogDisplayDisseminationAction,
  type LogDisplayLogsActionRequest,
  PiWebserviceProvider,
  type ProductsMetaDataFilter,
} from '@deltares/fews-pi-requests'
import { hashObject, useProducts } from '@/services/useProducts'
import { type DocumentBrowserDisplay } from '@/lib/products/documentDisplay'
import { toHumanReadableDate } from '@/lib/date'
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
import { DateTime } from 'luxon'
import { postFileProduct, postProduct } from '@/lib/products/requests'
import { useLogDisplay } from '@/services/useLogDisplay'
import { convert } from 'html-to-text'
import { clickDownloadUrl } from '@/lib/download'

const LOG_DISPLAY_ID = 'email_reports'

interface Props {
  config?: DocumentBrowserDisplay
  productId?: string
}

const { config, productId } = defineProps<Props>()
const src = ref('')
const viewMode = ref('')

const selected = ref(0) // Example timeZero
const selectedProduct = computed(() => {
  return filteredProducts.value[selected.value]
})

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
const showAllVersions = ref(false)

const filter = computed(() => {
  if (
    viewPeriod.value.start === undefined ||
    viewPeriod.value.end === undefined
  ) {
    return {}
  }

  const result: ProductsMetaDataFilter = {
    versionKey: ['productId'],
  }
  return result
})

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const actionIsActive = ref(false) // Flag to indicate if a dissemination action is active
const { logDisplay } = useLogDisplay(baseUrl, () => LOG_DISPLAY_ID)

const archiveProductSets = computed(() => {
  return config?.browser?.archiveProductSets ?? []
})

const archiveProducts = computed(() => {
  return config?.browser?.archiveProducts ?? []
})

const canUpload = computed(() => {
  return archiveProductSets.value.length > 0
})

const file = ref<File>()
const uploadData = ref<
  | {
      name: string
      author: string
      timeZero?: string
    }
  | undefined
>()

const { userName } = useCurrentUser()

function newUploadFile() {
  uploadData.value = {
    name: '',
    author: userName.value || '',
  }
}

function newProduct() {
  uploadData.value = {
    name: mostRecentTemplate.value?.attributes.name || '',
    author: userName.value || '',
    timeZero: mostRecentTemplate.value?.timeZero,
  }
}

watch(file, (newFile) => {
  if (newFile && uploadData.value) {
    uploadData.value.name = newFile.name
  }
})
const uploadIsValid = ref(false)

const canCreateNew = computed(() => {
  return mostRecentTemplate.value !== undefined
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

const {
  products,
  getProductByKey,
  fetchProducts,
  lastUpdated,
  mostRecentTemplate,
} = useProducts(
  baseUrl,
  filter,
  viewPeriod,
  sourceId,
  areaId,
  archiveProductSets,
  archiveProducts,
)

const filteredProducts = computed(() => {
  if (showAllVersions.value) {
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
  const documentDisplay = toValue(config)
  if (documentDisplay) {
    viewPeriod.value = periodToIntervalItem(documentDisplay.relativeViewPeriod)
  }
})

watchEffect(() => {
  if (productId) {
    const productMetaData = getProductByKey(productId)
    if (productMetaData) {
      selected.value = filteredProducts.value.findIndex(
        (p) => p.key === productMetaData.key,
      )
    } else {
      console.warn(`Product with ID ${productId} not found.`)
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

function resetUpload() {
  uploadData.value = undefined
  file.value = undefined
}

async function uploadProduct() {
  if (canUpload.value && uploadData.value && file.value) {
    await uploadProductFile(file.value)
  } else if (
    canCreateNew.value &&
    uploadData.value &&
    mostRecentTemplate.value
  ) {
    const url = getProductURL(baseUrl, mostRecentTemplate.value)
    const transformRequest = createTransformRequestFn()
    const request = await transformRequest(new Request(url, {}))
    const response = await fetch(request)
    const htmlContent = await response.text()
    const newProductEntry: ProductMetaDataType = {
      ...mostRecentTemplate.value,
      attributes: {
        ...mostRecentTemplate.value.attributes,
        author: uploadData.value.author,
        name: uploadData.value.name,
        productId: mostRecentTemplate.value.attributes.productId.replace(
          /^template_/,
          '',
        ),
      },
    }
    const fileName =
      mostRecentTemplate.value.relativePathProducts[0].split('/').pop() ??
      'unknown'
    await uploadHtmlProduct(newProductEntry, htmlContent, fileName)
  }
}

async function uploadHtmlProduct(
  metaData: ProductMetaDataType,
  htmlContent: string,
  fileName: string,
) {
  const piUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
  const archiveUrl = `${piUrl}rest/fewspiservice/v1/archive/`
  try {
    await postProduct(
      archiveUrl,
      metaData.areaId,
      metaData.sourceId,
      metaData.timeZero,
      htmlContent,
      fileName,
      metaData.attributes,
    )
    await fetchProducts()
  } catch (error) {
    console.error('Error uploading new product:', error)
    return
  } finally {
    uploadData.value = undefined
  }
}

async function uploadProductFile(file?: File) {
  if (!canUpload.value || !uploadData || !file) return
  try {
    const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
    const productId = await hashObject(uploadData.value)
    const timeZero = DateTime.now().toUTC().startOf('second').toISO({
      suppressMilliseconds: true,
    })
    const attributes = {
      ...uploadData.value,
      productId: productId,
    }

    await postFileProduct(
      `${baseUrl}rest/fewspiservice/v1/archive/`,
      areaId.value,
      sourceId.value,
      timeZero,
      file,
      attributes,
    )
    await fetchProducts()
  } catch (error) {
    console.error('Upload error:', error)
  } finally {
    uploadData.value = undefined
  }
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

.product-browser__table {
  width: 600px;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
}
</style>
