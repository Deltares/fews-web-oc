<template>
  <v-dialog v-model="showDialog" max-width="900">
    <v-card @click="showDialog = false" style="cursor: default">
      <v-img :src="imgUrl" />
      <div class="overlay">
        <div>Viewer Version {{ version }}</div>
        <v-btn @click.prevent="routeToTerms" variant="text">Terms of Use</v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router';

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
      path: 'terms-of-use'
    }
  })
}
</script>

<style scoped>
.overlay {
  position: absolute;
  bottom: 12px;
  right: 20px;
  text-align: right;
  color: black;
}
</style>
