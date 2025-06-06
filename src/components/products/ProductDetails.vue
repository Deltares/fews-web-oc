<template>
  <v-card
    border
    flat
    density="compact"
    :ripple="false"
    :to="routeForProduct(product)"
  >
    <v-card-text class="py-2 h-100" to="">
      <v-list-item-title>
        {{ product.attributes.author ?? 'Unknown' }}
      </v-list-item-title>
      <v-card-subtitle class="align-self-end">
        {{ product.attributes.name ?? product.key }}
      </v-card-subtitle>
      <v-list-item-subtitle class="mb-1">
        {{ product.timeZero }}
      </v-list-item-subtitle>
    </v-card-text>
  </v-card>
</template>
<script setup lang="ts">
import type { ProductMetaDataType } from '@/services/useProducts/types';

interface Props {
  product: ProductMetaDataType
}

defineProps<Props>()

function routeForProduct(product: ProductMetaDataType) {
  return {
    name: 'TopologyDocumentDisplay',
    params: {
      productId: product.key,
    },
  }
}
</script>
