<template>
  <AnalysisChartCard :chart="chart" v-bind="$attrs">
    <div class="h-100 w-100 px-8 d-flex justify-center align-center">
      <v-card
        flat
        class="product-container mb-4 d-flex justify-center overflow-y-auto"
        max-height="400"
        max-width="1000"
        width="100%"
      >
        <Product :product="chart.product" />
      </v-card>
    </div>
  </AnalysisChartCard>
</template>

<script setup lang="ts">
import AnalysisChartCard from '@/components/analysis/AnalysisChartCard.vue'
import { ProductChart } from '@/lib/analysis'
import Product from '@/components/products/Product.vue'

interface Props {
  chart: ProductChart
}
defineProps<Props>()
</script>

<style scoped>
.product-container :deep(img) {
  width: 100%;
  height: auto;
  max-height: 100%;
  object-fit: contain;
}

.product-container :deep(iframe) {
  width: 100%;
  height: 400px;
}
</style>
