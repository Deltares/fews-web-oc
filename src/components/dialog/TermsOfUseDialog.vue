<template>
  <v-dialog v-model="showTermsDialog" persistent max-width="900">
    <v-card style="cursor: default">
      <v-card-title class="text-h5">Terms of Use</v-card-title>
      <HtmlDisplay :url="url" />
      <v-card-actions class="pt-0">
        <v-checkbox
          v-model="isInAgreement"
          label="I have read and agree to the Terms and Conditions"
          hide-details
          density="comfortable"
        />
        <v-spacer />
        <v-btn
          @click="onAgreeClick"
          variant="flat"
          color="primary"
          class="text-capitalize"
          :disabled="!isInAgreement"
        >
          Accept
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { useConfigStore } from '@/stores/config'
import { computed, ref } from 'vue'
import HtmlDisplay from '@/components/general/HtmlDisplay.vue'

const showTermsDialog = defineModel({ default: false })
const isInAgreement = ref(false)

const termsPath = 'terms-of-use'
const configStore = useConfigStore()
const url = computed(() => {
  const matchingComponent = configStore
    .getComponentsByType('HtmlDisplay')
    ?.find((c) => c.path === termsPath)
  return matchingComponent?.url
})

function onAgreeClick() {
  if (isInAgreement.value) {
    showTermsDialog.value = false
  }
}
</script>
