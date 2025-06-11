<template>
  <AnalysisChartCard :chart="chart" v-bind="$attrs">
    <div class="product-container px-8 mb-4">
      <Product :product="chart.product" />
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
.product-container {
  max-height: 400px;
  width: 100%;
  overflow: hidden;
  display: flex;
  justify-content: center;
}

.product-container :deep(img) {
  width: 100%;
  height: auto;
  max-height: 100%;
  object-fit: contain;
}

.product-container :deep(iframe) {
  width: min(1000px, 100%);
  height: 400px;
  border-radius: 2px;
}
</style>
