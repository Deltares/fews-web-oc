<template>
  <v-dialog v-model="showDialog" max-width="900">
    <v-card
      v-if="!showDisclaimer"
      @click="showDialog = false"
      style="cursor: default"
    >
      <v-img :src="imgUrl" />
      <div class="overlay">
        <div>Viewer Version {{ version }}</div>
        <a
          v-if="termsUrl"
          @click.stop="showDisclaimer = true"
          style="cursor: pointer"
          >Terms of Use</a
        >
      </div>
    </v-card>
    <v-card v-else>
      <v-card-title>USER TERMS AND CONDITIONS</v-card-title>
      <v-card-text class="scroll" v-html="disclaimerText"></v-card-text>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'

interface Props {
  imgUrl: string
  version: string
  termsUrl?: string
}
const props = defineProps<Props>()

const showDialog = ref(true)
const showDisclaimer = ref(false)

const disclaimerText = ref<string>()

watch(
  () => props.termsUrl,
  async () => {
    if (!props.termsUrl) return

    try {
      const response = await fetch(props.termsUrl)
      disclaimerText.value = await response.text()
    } catch (error) {
      // Handle fetch error
    }
  },
)
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
