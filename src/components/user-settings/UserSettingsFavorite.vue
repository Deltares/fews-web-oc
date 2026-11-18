<template>
  <v-btn
    color="grey-lighten-1"
    :icon="favorite ? 'mdi-star' : 'mdi-star-outline'"
    @click="favorite = !favorite"
    v-tooltip:top="t('userSettings.favorite')"
  />
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const favorite = defineModel<boolean>({ required: true })
</script>
