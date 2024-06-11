<template>
  <v-dialog v-model="showDialog" max-width="900">
    <v-card @click="showDialog = false" style="cursor: default">
      <v-img :src="imgUrl" />
      <div class="info-overlay">
        <div v-if="version">Delft-FEWS WebOC Version {{ version }}</div>
        <a
          v-if="termsComponent"
          @click.prevent="routeToTerms"
          variant="text"
          class="terms-button"
          >{{ termsComponent.title }}</a
        >
      </div>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { useConfigStore } from '@/stores/config'
import { computed } from 'vue'
import { useRouter } from 'vue-router'

interface Props {
  imgUrl: string
  version?: string
}
defineProps<Props>()

const showDialog = defineModel({ default: false })

const router = useRouter()

const termsPath = 'terms-of-use'
const configStore = useConfigStore()
const termsComponent = computed(() =>
  configStore
    .getComponentsByType('htmlDisplay')
    ?.find((c) => c.path === termsPath),
)

function routeToTerms() {
  router.push({
    name: 'HtmlDisplay',
    params: {
      path: termsPath,
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
