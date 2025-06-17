<template>
  <div class="d-flex flex-column h-100 w-100">
    <EditReport v-if="isEditing" v-model="htmlContent" @save="onSave" />
    <div v-if="!isEditing" class="flex-1-1 h-100 flex-column position-relative">
      <v-toolbar density="compact" absolute>
        <v-btn
          v-if="viewMode === 'html' && editorEnabled"
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
              :loading="disseminateActionIsActive"
            />
          </template>
          <v-list density="compact">
            <v-list-item
              v-if="viewMode === 'html'"
              prepend-icon="mdi-email"
              title="Open in Email Client..."
              @click="openEmailClient"
            />
            <v-list-item
              v-for="action in logDisplay?.logDissemination
                ?.disseminationActions"
              :prepend-icon="action.iconId"
              :title="action.description"
              @click="disseminateLog(createLogEntry(), action)"
            >
            </v-list-item>
          </v-list>
        </v-menu>
        <v-spacer />
        <v-toolbar-items>
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
import { getProductURL } from '@/components/products/productTools'
import { createTransformRequestFn } from '@/lib/requests/transformRequest'
import {
  IntervalItem,
  intervalToFewsPiDateRange,
  periodToIntervalItem,
} from '@/lib/TimeControl/interval'
import { attributesToObject, useProducts } from '@/services/useProducts'
import {
  LogDisplayDisseminationAction,
  LogDisplayLogsActionRequest,
  PiWebserviceProvider,
  ProductsMetaDataFilter,
} from '@deltares/fews-pi-requests'
import { DateTime } from 'luxon'
import { computed, ref, toValue, watchEffect } from 'vue'
import { type ReportDisplay } from '@/lib/products/documentDisplay'
import ReactiveIframe from '@/components/products/ReactiveIframe.vue'
import { configManager } from '@/services/application-config'
import EditReport from '@/components/reports/EditReport.vue'
import DOMPurify from 'dompurify'
import { postProduct } from '@/lib/products/requests'
import { ProductMetaDataType } from '@/services/useProducts/types'
import { getFileExtension, getViewMode } from '@/lib/products'
import { convert } from 'html-to-text'
import { useLogDisplay } from '@/services/useLogDisplay'

const LOG_DISPLAY_ID = 'email_reports'
const LOG_ACTION_ID = 'email_reports'

interface Props {
  config?: ReportDisplay
  showAllVersions?: boolean
}

interface LogMessage {
  text: string
  level: 'INFO' | 'WARNING' | 'ERROR'
  taskRunId: string
  entryTime: string
}

const { showAllVersions = false, config } = defineProps<Props>()
const viewPeriod = ref<IntervalItem>({})
const editorEnabled = ref(false) // Example flag to enable editor mode
const isEditing = ref(false) // Example flag to toggle editing mode
const htmlContent = ref('') // Placeholder for HTML content
const disseminateActionIsActive = ref(false) // Flag to indicate if a dissemination action is active

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

  const archiveProduct = config?.report?.archiveProduct
  if (!archiveProduct) {
    console.warn('No archive product defined in the report configuration.')
    return {}
  }

  const attribute = attributesToObject(archiveProduct.attributes)

  const result: ProductsMetaDataFilter = {
    versionKey: archiveProduct.versionKeys,
    attribute,
    startForecastTime,
    endForecastTime,
  }
  return result
})


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

const sourceId = computed(() => {
  return config?.report?.archiveProduct.sourceId ?? ''
})
const areaId = computed(() => {
  return config?.report?.archiveProduct.areaId ?? ''
})

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const { products, fetchProducts } = useProducts(
  baseUrl,
  filter,
  sourceId,
  areaId,
)
const { logDisplay } = useLogDisplay(baseUrl, () => LOG_DISPLAY_ID)

const viewMode = ref('html') // or 'iframe', 'img'
const selected = ref(0) // Example timeZero
const selectedProduct = computed(() => {
  return filteredProducts.value[selected.value]
})
const src = ref('')

watchEffect(() => {
  const documentDisplay = toValue(config)
  if (documentDisplay) {
    viewPeriod.value = periodToIntervalItem(documentDisplay.relativeViewPeriod)
    editorEnabled.value = documentDisplay.editPermissions ?? false
  }
})

watchEffect(async () => {
  if (!filteredProducts.value || filteredProducts.value.length === 0) {
    console.warn('No products available for the selected filter.')
    src.value = ''
    selected.value = 0
    return
  }

  const productMetaData = filteredProducts.value[selected.value]

  const url = getProductURL(baseUrl, productMetaData)
  const extension = getFileExtension(url)

  const currentViewMode = getViewMode(extension)

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
  src.value = urlObject
})

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

function openEmailClient() {
  const subject = `${selectedProduct.value.attributes.name}: ${selectedProduct.value.timeZero}`
  const textContent = convert(htmlContent.value, {
    wordwrap: 130,
    selectors: [
      { selector: 'img', format: 'skip' }, // Skip images
      { selector: 'iframe', format: 'skip' }, // Skip iframes
    ],
  })
  const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(textContent)}`
  window.location.href = mailtoLink
}

function createLogEntry(): LogMessage {
  return {
    text: htmlContent.value,
    level: 'INFO',
    taskRunId: '',
    entryTime: DateTime.now().toISO(),
  }
}

async function disseminateLog(
  log: LogMessage,
  dissemination: LogDisplayDisseminationAction,
) {
  const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
  const provider = new PiWebserviceProvider(baseUrl, {
    transformRequestFn: createTransformRequestFn(),
  })

  const textContent = convert(log.text, {
    wordwrap: 130,
    selectors: [
      { selector: 'img', format: 'skip' }, // Skip images
      { selector: 'iframe', format: 'skip' }, // Skip iframes
    ],
  })

  const request: LogDisplayLogsActionRequest = {
    logDisplayId: LOG_DISPLAY_ID,
    actionId: LOG_ACTION_ID,
    logMessage: textContent,
    logLevel: 'INFO',
  }

  try {
    disseminateActionIsActive.value = true
    await provider.postLogDisplaysAction(request)
  } catch (error) {

  } finally {
    disseminateActionIsActive.value = false
  }
}
</script>

<style scoped>
.products-browser-view__canvas {
  position: absolute;
  top: 48px;
  bottom: 0;
  background-color: #e0e0e0;
}
</style>
