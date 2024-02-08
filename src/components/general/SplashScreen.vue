<template>
  <v-dialog v-model="showDialog" max-width="900">
    <v-card @click="showDialog = false" style="cursor: default">
      <v-img :src="imgUrl" />
      <div class="info-overlay">
        <div>Viewer Version {{ version }}</div>
        <a @click.prevent="routeToTerms" variant="text" class="terms-button">Terms of Use</a>
      </div>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

interface Props {
  imgUrl: string
  version: string
}
defineProps<Props>()

const router = useRouter()

const showDialog = ref(true)

function routeToTerms() {
  router.push({
    name: 'HtmlDisplay',
    params: {
      path: 'terms-of-use',
    },
  })
}
</script>

<style scoped>
.info-overlay {
  position: absolute;
  bottom: 12px;
  right: 20px;
  color: white;
  text-align: right;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
}

.terms-button {
  cursor: pointer;
}
</style>
