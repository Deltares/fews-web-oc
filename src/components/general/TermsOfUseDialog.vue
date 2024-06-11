<template>
  <v-dialog v-model="showTermsDialog" persistent max-width="900">
    <v-card style="cursor: default">
      <v-card-title class="text-h5">Terms of Use</v-card-title>
      <HtmlDisplay :url="url" />
      <v-card-actions class="pt-0">
        <div class="d-flex flex-column w-100 mx-2">
          <v-checkbox
            v-model="isInAgreement"
            label="I agree to the terms and conditions"
            hide-details
            density="comfortable"
          />
          <div class="d-flex mb-2">
            <v-spacer />
            <v-btn
              @click="onAgreeClick"
              variant="flat"
              color="primary"
              class="text-capitalize"
              :disabled="!isInAgreement"
            >
              I Agree
            </v-btn>
          </div>
        </div>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { useConfigStore } from '@/stores/config'
import { computed, ref } from 'vue'
import { useStorage } from '@vueuse/core'
import HtmlDisplay from '@/components/general/HtmlDisplay.vue'

const isInAgreement = ref(false)
const showTermsDialog = useStorage(
  'weboc-agree-to-terms-v1.0.0',
  true,
  sessionStorage,
  { mergeDefaults: true },
)

const termsPath = 'terms-of-use'
const configStore = useConfigStore()
const url = computed(() => {
  const matchingComponent = configStore
    .getComponentsByType('htmlDisplay')
    ?.find((c) => c.path === termsPath)
  return matchingComponent?.url
})

function onAgreeClick() {
  if (isInAgreement.value) {
    showTermsDialog.value = false
  }
}
</script>
