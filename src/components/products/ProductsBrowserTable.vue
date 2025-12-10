<template>
  <div class="products-browser position-relative h-100 d-flex flex-column">
    <v-toolbar density="compact">
      <v-text-field
        v-model="search"
        variant="outlined"
        density="compact"
        rounded=""
        placeholder="Search"
        hide-details
        class="px-4"
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
      fixed-header
      height="400"
      @click:row="onClick"
    >
      <template v-slot:headers="{ columns, isSorted, getSortIcon, toggleSort }">
        <tr>
          <template v-for="(column, index) in columns" :key="column.key">
            <th v-if="index === 0"></th>
            <th v-else-if="column.key === 'actions'" class="pa-0">
              <v-btn icon size="small" variant="plain">
                <v-icon icon="mdi-dots-vertical" />
                <v-menu
                  activator="parent"
                  :close-on-content-click="false"
                  location="bottom end"
                >
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
      <template v-slot:item.actions="{ item }">
        <v-btn
          v-if="item.attributes.name !== 'Create new'"
          icon="mdi-delete"
          size="small"
          variant="text"
          @click.stop="onDeleteProduct(item)"
          :title="'Delete product'"
          class="delete-action-btn"
          :hover="true"
        ></v-btn>
        <v-btn
          v-else
          icon="mdi-plus"
          size="small"
          variant="text"
          @click="onNewProduct(template ?? item)"
          :title="'Create new product'"
        ></v-btn>
      </template>
      <template v-slot:body.prepend="props">
        <slot name="prepend" v-bind="props"></slot>
      </template>
    </v-data-table>
    <div>
      <slot name="footer"> </slot>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, ref, watch, watchEffect } from 'vue'
import type { ProductMetaDataType } from '@/services/useProducts/types'
import { useRouter } from 'vue-router'
import { toHumanReadableDateTime } from '@/lib/date'
import { deleteProduct, postProduct } from '@/lib/products/requests'
import { configManager } from '@/services/application-config'
import { getProductURL } from './productTools'
import { useCurrentUser } from '@/services/useCurrentUser'
import { createTransformRequestFn } from '@/lib/requests/transformRequest'

interface AttributeHeader {
  attribute: string
  title: string
}

interface PropertyHeader {
  property: string
  title: string
}

export interface ProductBrowserTableConfig {
  preview: boolean | string
  type: 'table' | 'list'
  headers: (AttributeHeader | PropertyHeader)[]
}

function isPropertyHeader(
  header: PropertyHeader | AttributeHeader,
): header is PropertyHeader {
  return (header as PropertyHeader).property !== undefined
}

interface Props {
  products: ProductMetaDataType[]
  template?: ProductMetaDataType
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

watchEffect(() => {
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
      key: 'actions',
      title: '',
      align: 'end',
      sortable: false,
      width: '0px',
    } as const,
  ]
})

const items = computed(() => {
  const items: ProductMetaDataType[] = []
  items.push(
    ...props.products.map((product) => ({
      ...product,
      timeZero: toHumanReadableDateTime(product.timeZero),
      dataSetCreationTime: toHumanReadableDateTime(product.dataSetCreationTime),
    })),
  )

  return items
})

async function onDeleteProduct(product: ProductMetaDataType) {
  try {
    const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
    await deleteProduct(baseUrl, product)
  } catch (error) {
    console.error(error)
  } finally {
    const index = items.value.findIndex((p) => p.key === product.key)
    const previousItem = items.value[index - 1]
    emit('refresh')
    if (index > 0) {
      router.replace({
        name: 'TopologyDocumentDisplay',
        params: {
          productId: previousItem.key,
        },
      })
    }
  }
}

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

const { preferredUsername } = useCurrentUser()

async function onNewProduct(item: ProductMetaDataType) {
  const piUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
  const archiveUrl = `${piUrl}rest/fewspiservice/v1/archive/`
  const fileName = item.relativePathProducts[0].split('/').pop() ?? 'unknown'
  item.attributes.productId = item.attributes.productId.replace(
    /^template_/,
    '',
  )
  item.attributes.author = preferredUsername.value

  const transformRequest = createTransformRequestFn()
  const request = await transformRequest(
    new Request(getProductURL(piUrl, item), {}),
  )
  const htmlContent = await (await fetch(request)).text()
  try {
    await postProduct(
      archiveUrl,
      item.areaId,
      item.sourceId,
      item.timeZero,
      htmlContent,
      fileName,
      item.attributes,
    )
  } catch (error) {
    console.error('Error creating new product:', error)
  }
  emit('refresh')
}
</script>

<style scoped>
.refresh-container {
  height: 28px;
}

:deep(.selected-row) {
  background-color: rgb(var(--v-theme-on-surface), var(--v-activated-opacity));
}

.delete-action {
  opacity: 0;
}

:deep(.v-data-table__tr:hover) .delete-action-btn {
  opacity: 1;
}

.delete-action-btn {
  opacity: 0;
  transition: opacity 0.2s ease-in-out;
}
</style>
