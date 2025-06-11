<template>
  <div class="products-browser position-relative h-100 d-flex flex-column">
    <v-toolbar density="compact">
      <v-btn
        prepend-icon="mdi-file-upload"
        class="text-none"
        variant="flat"
        color="primary"
        @click="showUploadDialog = true"
        >Upload</v-btn
      >
      <v-spacer />
      <v-text-field
        v-model="search"
        variant="underlined"
        density="compact"
        placeholder="Search"
        hide-details
        class="me-4"
        append-inner-icon="mdi-magnify"
      ></v-text-field>
      <v-btn prepend-icon="mdi-filter-variant">
        <v-menu activator="parent">
          <v-list density="compact">
            <v-list-subheader>Filter</v-list-subheader>
            <v-item-group>
              <v-list-item prepend-icon="mdi-file-pdf-box">PDF</v-list-item>
              <v-list-item prepend-icon="mdi-file-image">Images</v-list-item>
            </v-item-group>
          </v-list>
        </v-menu>
      </v-btn>
      <v-btn prepend-icon="mdi-sort">
        <v-menu activator="parent" :close-on-content-click="false">
          <v-list v-model:selected="groupByKey" density="compact">
            <v-list-subheader>Group by</v-list-subheader>
            <v-list-item v-for="column in filteredColumns" :value="column.key">
              {{ column.title }}
              <template v-slot:prepend="{ isSelected, select }">
                <v-list-item-action start>
                  <v-checkbox-btn
                    :model-value="isSelected"
                    @update:model-value="select"
                    true-icon="mdi-check"
                    false-icon=""
                  ></v-checkbox-btn>
                </v-list-item-action>
              </template>
            </v-list-item>
          </v-list>
        </v-menu>
      </v-btn>
    </v-toolbar>
    <v-data-table
      v-if="items.length > 0"
      v-model="selectedRows"
      :items="items"
      :headers="headers"
      :expanded="[]"
      :items-per-page="-1"
      item-value="key"
      hover
      :group-by="[groupBy]"
      :search="search"
      hide-default-footer
      :row-props="
        (data) => ({
          class: selectedRows.includes(data.item.key)
            ? 'selected-row'
            : 'unselected-row',
        })
      "
      class="d-flex flex-1-1"
      density="compact"
      @click:row="onClick"
    >
      <template v-slot:headers="{ columns, isSorted, getSortIcon, toggleSort }">
        <tr>
          <template v-for="(column, index) in columns" :key="column.key">
            <th v-if="index === 0"></th>
            <th v-else-if="column.key === 'Actions'" class="pa-0">
              <v-btn icon size="small" variant="plain">
                <v-icon icon="mdi-dots-vertical" />
                <v-menu activator="parent" :close-on-content-click="false">
                  <v-list
                    v-model:selected="selectedColumns"
                    select-strategy="independent"
                    density="compact"
                  >
                    <v-list-subheader>View columns</v-list-subheader>
                    <v-list-item
                      v-for="column in availableColumns"
                      :key="column.key"
                      :value="column.key"
                    >
                      {{ column.title }}
                      <template v-slot:prepend="{ isSelected, select }">
                        <v-list-item-action start>
                          <v-checkbox-btn
                            :model-value="isSelected"
                            @update:modelValue="select"
                          ></v-checkbox-btn>
                        </v-list-item-action>
                      </template>
                    </v-list-item>
                  </v-list>
                </v-menu>
              </v-btn>
            </th>
            <th v-else>
              <div class="d-flex align-center">
                <span
                  class="me-2 cursor-pointer"
                  @click="toggleSort(column)"
                  v-text="column.title"
                ></span>

                <v-icon
                  v-if="isSorted(column)"
                  :icon="getSortIcon(column)"
                  color="medium-emphasis"
                ></v-icon>
              </div>
            </th>
          </template>
        </tr>
      </template>
      <template
        v-slot:group-header="{ item, columns, toggleGroup, isGroupOpen }"
      >
        <tr>
          <td :colspan="columns.length">
            <v-list-item density="compact" class="px-0">
              <v-list-item-subtitle>
                {{ groupBy.name }}
                <span> {{ item.value }} </span>
                <v-chip class="ms-4" size="small">{{
                  item.items.length
                }}</v-chip>
              </v-list-item-subtitle>
              <template v-slot:prepend>
                <v-btn
                  :icon="isGroupOpen(item) ? '$expand' : '$next'"
                  color="medium-emphasis"
                  density="comfortable"
                  @click="toggleGroup(item)"
                ></v-btn>
              </template>
            </v-list-item>
          </td>
        </tr>
      </template>
    </v-data-table>
    <div>
      <slot name="footer"> </slot>
    </div>
    <v-dialog v-model="showUploadDialog" max-width="600px">
      <v-card>
        <v-card-title>
          <span class="text-h5">Upload Product</span>
        </v-card-title>
        <v-card-text>
          <v-alert v-if="uploadError" type="error" variant="tonal" class="mb-4">
            {{ uploadError }}
          </v-alert>

          <v-file-input
            v-model="uploadFile"
            :loading="uploading"
            :disabled="uploading"
            truncate-length="30"
            accept=".pdf,.jpg,.jpeg,.png"
            placeholder="Select file"
            prepend-icon="mdi-file-document-outline"
            label="Product File"
            hint="Select a file to upload"
            :rules="[(v) => !!v || 'A file is required']"
          ></v-file-input>

          <v-text-field
            v-model="uploadData.name"
            label="Product Name"
            :disabled="uploading"
            :rules="[(v) => !!v || 'Product name is required']"
            class="mt-4"
          ></v-text-field>

          <v-text-field
            v-model="uploadData.author"
            label="Author"
            :disabled="uploading"
            :rules="[(v) => !!v || 'Author name is required']"
            class="mt-4"
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="grey-darken-1"
            variant="text"
            :disabled="uploading"
            @click="showUploadDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            :loading="uploading"
            :disabled="!canUpload"
            variant="flat"
            @click="uploadProduct"
          >
            Upload
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { ProductMetaDataType } from '@/services/useProducts/types'
import { useRouter } from 'vue-router'
import { toHumanReadableDate } from '@/lib/date'
import { configManager } from '@/services/application-config'
import { createTransformRequestFn } from '@/lib/requests/transformRequest'
import { DateTime } from 'luxon'

interface AttributeHeader {
  attribute: string
  title: string
}

interface PropertyHeader {
  property: string
  title: string
}

export interface ProductBrowserTableConfig {
  headers: (AttributeHeader | PropertyHeader)[]
}

function isPropertyHeader(
  header: PropertyHeader | AttributeHeader,
): header is PropertyHeader {
  return (header as PropertyHeader).property !== undefined
}

interface Props {
  products: ProductMetaDataType[]
  config: ProductBrowserTableConfig
  productId?: string
}

const props = defineProps<Props>()
const emit = defineEmits(['refresh'])

const router = useRouter()

// Search and filtering state
const search = ref('')
const groupByKey = ref([''])
const groupByOrder = ref<[boolean | 'asc' | 'desc']>(['asc'])
const selectedColumns = ref<string[]>([])
const selectedRows = ref<string[]>([])

// Upload dialog state
const showUploadDialog = ref(false)
const uploading = ref(false)
const uploadError = ref('')
const uploadFile = ref<File | undefined>(undefined)
const uploadData = ref({
  name: '',
  author: '',
})

// Computed properties for upload validation and table display
const canUpload = computed(() => {
  const hasName = uploadData.value.name.trim() !== ''
  const hasAuthor = uploadData.value.author.trim() !== ''
  if (!uploadFile.value || !hasName || !hasAuthor) {
    return false
  }
  return true
})

const resetUploadForm = () => {
  uploadFile.value = undefined
  uploadData.value = {
    name: '',
    author: '',
  }
  uploadError.value = ''
}

// Upload product function
async function uploadProduct() {
  if (!canUpload.value) return

  uploading.value = true
  uploadError.value = ''

  try {
    const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
    const timeZero = DateTime.now().toUTC().startOf('second').toISO({
      suppressMilliseconds: true,
    })
    const url = `${baseUrl}rest/fewspiservice/v1/archive/products?areaId=${props.products[0].areaId}&sourceId=${props.products[0].sourceId}&timeZero=${timeZero}&attribute(productId)=${toSnakeCase(uploadData.value.name)}&attribute(name)=${uploadData.value.name}&attribute(status)=concept&attribute(author)=${uploadData.value.author}`
    // remove whitespace from URL
    const formData = new FormData()
    formData.append('file', uploadFile.value as File)

    // Use transformRequestFn to properly handle authentication
    const transformRequest = createTransformRequestFn()
    const request = new Request(url, {
      method: 'POST',
      body: formData,
    })
    const authenticatedRequest = await transformRequest(request)
    const response = await fetch(authenticatedRequest)

    if (!response.ok) {
      const msg = await response.text()
      throw new Error(msg || 'Failed to send request.')
    }

    // Reset the form and close dialog on success
    resetUploadForm()
    showUploadDialog.value = false

    // Refresh the product list
    emit('refresh')

    // Update last updated time
    lastUpdatedString.value = new Date().toLocaleString()
  } catch (error) {
    console.error('Upload error:', error)
    uploadError.value =
      error instanceof Error
        ? error.message
        : 'An unknown error occurred while uploading your product'
  } finally {
    uploading.value = false
  }
}

const groupBy = computed(() => {
  return {
    key: groupByKey.value[0],
    order: groupByOrder.value[0],
    name: groupName(groupByKey.value[0]),
  }
})
function groupName(key: string) {
  const column = availableColumns.value.find((column) => {
    return column.key === key
  })
  return column?.title || key
}

onMounted(() => {
  if (props.productId) {
    selectedRows.value = [props.productId]
  }
})

const availableColumns = ref<
  { key: string; title: string; align?: 'start' | 'center' | 'end' }[]
>([])

watch(
  () => props.config?.headers,
  (newHeaders) => {
    if (!newHeaders) {
      availableColumns.value = []
      return
    }
    const result = newHeaders.map((header) => ({
      key: isPropertyHeader(header)
        ? header.property
        : `attributes.${header.attribute}`,
      title: header.title,
    }))
    availableColumns.value = result
    selectedColumns.value = result.map((column) => column.key)
  },
  { immediate: true },
)

const filteredColumns = computed(() => {
  return availableColumns.value.filter((column) => {
    return selectedColumns.value.includes(column.key)
  })
})

const headers = computed(() => {
  return [
    ...filteredColumns.value.filter((column) => {
      return column.key !== groupBy.value.key
    }),
    {
      key: 'Actions',
      title: '',
      align: 'end',
    } as const,
  ]
})

const items = computed(() => {
  return props.products.map((product) => ({
    ...product,
    timeZero: toHumanReadableDate(product.timeZero),
    dataSetCreationTime: toHumanReadableDate(product.dataSetCreationTime),
  }))
})

function onClick(
  _event: PointerEvent,
  entry: {
    item: ProductMetaDataType
  },
) {
  selectedRows.value = [entry.item.key]
  router.push({
    name: 'TopologyDocumentDisplay',
    params: {
      productId: entry.item.key,
    },
  })
}
/**
 * Converts a string to snake case format
 * @param name The string to convert to snake case
 * @returns The string in snake_case format
 */
function toSnakeCase(name: string): string {
  // Convert spaces to underscores and lowercase the string
  return (
    name
      .toLowerCase()
      // Replace spaces with underscores
      .replace(/\s+/g, '_')
      // Remove special characters and replace with underscores
      .replace(/[^\w_]/g, '_')
      // Replace multiple consecutive underscores with a single one
      .replace(/_+/g, '_')
      // Remove leading and trailing underscores
      .replace(/^_|_$/g, '')
  )
}
</script>

<style scoped>
.refresh-container {
  height: 28px;
}

:deep(.selected-row) {
  background-color: rgb(var(--v-theme-on-surface), var(--v-activated-opacity));
}
</style>
