<template>
  <div v-if="isLoading" class="h-100 w-100 d-flex justify-center align-center">
    <v-progress-circular indeterminate color="primary" />
  </div>
  <template v-else>
    <img v-if="viewMode === 'img'" :src="src" />
    <template v-if="['html', 'pdf', 'iframe'].includes(viewMode)">
      <iframe :src="src" title="Document Viewer" />
    </template>
  </template>
</template>

<script setup lang="ts">
import { configManager } from '@/services/application-config'
import { ProductMetaDataType } from '@/services/useProducts/types'
import { computed, ref, watch } from 'vue'
import { getProductURL } from '@/components/products/productTools'
import { createTransformRequestFn } from '@/lib/requests/transformRequest'
import { getFileExtension, getViewMode } from '@/lib/products'

interface Props {
  product: ProductMetaDataType | undefined
}
const props = defineProps<Props>()

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const url = computed(() => getProductURL(baseUrl, props.product))
const viewMode = computed(() => getViewMode(getFileExtension(url.value)))

const isLoading = ref(true)
const src = ref('')
watch(
  url,
  async (newUrl) => {
    isLoading.value = true
    src.value = await getUrl(newUrl)
    isLoading.value = false
  },
  { immediate: true },
)

async function getUrl(url: string) {
  const transformRequest = createTransformRequestFn()
  const request = await transformRequest(new Request(url, {}))
  const response = await fetch(request)
  const blob = await response.blob()
  return URL.createObjectURL(blob)
}
</script>

<style scoped>
iframe {
  border: none;
}
</style>
