<template>
  <div class="products-browser-panel h-100">
    <v-toolbar density="compact">
      <v-btn prepend-icon="mdi-file-upload" class="text-none" variant="flat"
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
        <v-menu activator="parent">
          <v-list density="compact">
            <v-list-subheader>Sort by</v-list-subheader>
            <v-item-group>
              <v-list-item>Date</v-list-item>
              <v-list-item>Name</v-list-item>
              <v-list-item>Status</v-list-item>
            </v-item-group>
            <v-divider />
            <v-list-subheader>Sort order</v-list-subheader>
            <v-item-group>
              <v-list-item>Descending</v-list-item>
              <v-list-item>Ascending</v-list-item>
            </v-item-group>
          </v-list>
        </v-menu>
      </v-btn>
    </v-toolbar>
    <div class="overflow-y-auto">
      <v-list-item v-if="props.products?.length === 0">
        No products available.
      </v-list-item>
      <!-- Important to have item-height as it greatly improves performance -->
      <v-virtual-scroll
        v-else
        class="scroll-container h-100"
        :items="props.products"
        :item-height="62"
      >
        <template #default="{ item }">
          <ProductDetails :product="item" />
        </template>
      </v-virtual-scroll>
    </div>
    <v-divider />
    <v-list-item :title="`Last updated: ${lastUpdatedString}`">
      <template #append>
        <v-progress-circular v-if="isLoading" size="20" indeterminate />
        <v-btn v-else density="compact" variant="plain" icon="mdi-refresh" />
      </template>
    </v-list-item>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import ProductDetails from './ProductDetails.vue'
import type { ProductMetaDataType } from '@/services/useProducts/types'

interface Props {
  products: ProductMetaDataType[]
}

const props = defineProps<Props>()

const isLoading = ref(false)
const lastUpdatedString = ref('')
</script>

<style scoped>
.refresh-container {
  height: 28px;
}

.products-browser-panel {
  width: 450px;
  display: grid;
  grid-template-rows: auto 1fr auto auto;
}
</style>
