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
        <v-spacer />
        <v-toolbar-items>
          <v-btn append-icon="mdi-chevron-down" class="me-4">
            {{ selectedTimeZero }}
            <v-menu activator="parent">
              <v-list density="compact">
                <v-item-group>
                  <v-list-item v-for="item in items" :key="item.timeZero">
                    {{ item.timeZero }}
                  </v-list-item>
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
import { getProductURL } from '@/components/products/productTools'
import { createTransformRequestFn } from '@/lib/requests/transformRequest'
import { IntervalItem, periodToIntervalItem } from '@/lib/TimeControl/interval'
import { attributesToObject, useProducts } from '@/services/useProducts'
import { ProductsMetaDataFilter } from '@deltares/fews-pi-requests'
import { DateTime } from 'luxon'
import { computed, ref, toValue, watchEffect } from 'vue'
import { type ReportDisplay } from '@/lib/products/documentDisplay'
import ReactiveIframe from '@/components/products/ReactiveIframe.vue'
import { configManager } from '@/services/application-config'
import EditReport from '@/components/reports/EditReport.vue'
import DOMPurify from 'dompurify'

interface Props {
  config?: ReportDisplay
}

const props = defineProps<Props>()
const viewPeriod = ref<IntervalItem>({})
const editorEnabled = ref(false) // Example flag to enable editor mode
const isEditing = ref(false) // Example flag to toggle editing mode
const htmlContent = ref('') // Placeholder for HTML content

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

  console.log('Filter attributes:', props.config?.report?.archiveProduct)

  const archiveProduct = props.config?.report?.archiveProduct
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

const items = computed(() => {
  return products.value.map((product) => {
    return {
      timeZero:
        DateTime.fromISO(product.timeZero ?? 'Invalid timeZero')
          .toUTC()
          .toISO() ?? undefined,
    }
  })
})

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const { products } = useProducts(baseUrl, filter)

const viewMode = ref('html') // or 'iframe', 'img'
const selectedTimeZero = ref('') // Example timeZero
const src = ref('')

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

watchEffect(() => {
  const documentDisplay = toValue(props.config)
  console.log('Config changed:', props.config)
  if (documentDisplay) {
    viewPeriod.value = periodToIntervalItem(documentDisplay.relativeViewPeriod)
    editorEnabled.value = documentDisplay.report?.editor ?? false
    console.log('View period set to:', viewPeriod.value)
  }
})

watchEffect(async () => {
  const productMetaData = products.value[0]
  console.log('Selected product metadata:', productMetaData)
  if (!productMetaData) {
    src.value = ''
    selectedTimeZero.value = ''
    return
  }
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
  selectedTimeZero.value = productMetaData.timeZero
  src.value = urlObject
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
</style>
