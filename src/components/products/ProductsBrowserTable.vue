<template>
  <div class="products-browser-panel h-100">
    <v-toolbar density="compact">
      <v-btn
        prepend-icon="mdi-file-upload"
        class="text-none"
        variant="flat"
        disabled
        >Upload</v-btn
      >
      <v-spacer />
      <v-btn prepend-icon="mdi-magnify"></v-btn>
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
            <v-list-subheader>Sort by</v-list-subheader>
            <v-list-item v-for="column in availableColumns" :value="column.key">
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
      :items="items"
      :headers="headers"
      :expanded="[]"
      :items-per-page="-1"
      :group-by="[groupBy]"
      hide-default-footer
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
                <v-menu
                  :selected="selectedColumns"
                  activator="parent"
                  :close-on-content-click="false"
                >
                  <v-list select-strategy="independent" density="compact">
                    <v-list-subheader>View columns</v-list-subheader>
                    <v-list-item
                      v-for="column in availableColumns"
                      :value="column.key"
                    >
                      {{ column.title }}
                      <template v-slot:prepend="{ isSelected, select }">
                        <v-list-item-action start>
                          <v-checkbox-btn
                            :model-value="isSelected"
                            @update:model-value="select"
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
                {{ groupName(groupByKey[0]) }} 
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
    <v-list-item :title="`Last updated: ${lastUpdatedString}`">
      <template #append>
        <v-progress-circular v-if="isLoading" size="20" indeterminate />
        <v-btn v-else density="compact" variant="plain" icon="mdi-refresh" />
      </template>
    </v-list-item>
  </div>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ProductMetaDataType } from '@/services/useProducts/types';
import { useRouter } from 'vue-router'
import { toHumanReadableDate } from '@/lib/date'
import attributeNames from '@/assets/attributeNames.json'

interface Props {
  products: ProductMetaDataType[]
}

const props = defineProps<Props>()

const router = useRouter()
const groupByKey = ref(['attributes.status'])
const groupByOrder = ref<[boolean | 'asc' | 'desc']>(['asc'])
const selectedColumns = ref<string[]>([])

const typedAttributeNames = attributeNames as Record<string, string>

const groupBy = computed(() => {
  return {
    key: groupByKey.value[0],
    order: groupByOrder.value[0],
  }
})
function groupName(key: string) {
  const groupByKey = key.split('.')[1]
  return typedAttributeNames[groupByKey] ?? groupByKey
}

const availableColumns = computed(() => {
  const attributesSet = new Set<string>()
  for (const product of props.products) {
    for (const key of Object.keys(product.attributes)) {
      attributesSet.add(key)
    }
  }
  return [
    { key: 'timeZero', title: attributeNames.timeZero },
    { key: 'dataSetCreationTime', title: attributeNames.dataSetCreationTime },
    ...Array.from(attributesSet).filter((key) =>
      typedAttributeNames[key]
    ).map((key) => {
      return {
        key: `attributes.${key}`,
        title: typedAttributeNames[key] ?? key,
      }
    }),
  ]
})

const headers = computed(() => {
  return [
    ...availableColumns.value
      .filter((column) => {
        return column.key !== groupBy.value.key
      }),
    {
      key: 'Actions',
      title: '',
    },
  ]
})

const items = computed(() => {
  return props.products.map((product) => ({
    ...product,
    timeZero: toHumanReadableDate(product.timeZero),
    dataSetCreationTime: toHumanReadableDate(product.dataSetCreationTime),
  }))
})

const isLoading = ref(false)
const lastUpdatedString = ref('')

function onClick(_event: PointerEvent, entry: { item: ProductMetaDataType }) {
  router.push({
    name: 'ProductsBrowser',
    params: {
      productId: entry.item.key,
    },
  })
}
</script>

<style scoped>
.refresh-container {
  height: 28px;
}

.products-browser__table {
  height: 100%;
  display: grid;
  grid-template-rows: auto 1fr auto auto;
}
</style>
