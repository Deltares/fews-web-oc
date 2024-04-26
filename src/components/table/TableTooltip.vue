<template>
  <div v-show="props.flag">
    <v-icon :style="{ color: props.flagColor }">mdi-flag-variant</v-icon>
    {{ props.flagName }}
  </div>
  <div v-show="props.flagSource">
    <v-icon>mdi-access-point</v-icon>
    {{ props.flagSource }}
  </div>
  <div v-show="props.comment">
    <v-icon>mdi-comment</v-icon> {{ props.comment }}
  </div>
  <div v-show="props.user"><v-icon>mdi-account</v-icon> {{ props.user }}</div>
</template>

<script setup lang="ts">
interface Props {
  flag?: string
  flagName?: string
  flagSource?: string
  flagColor?: string
  user?: string
  comment?: string
}

const props = withDefaults(defineProps<Props>(), {
  flag: '',
  flagName: '',
  flagSource: '',
  user: '',
  comment: '',
})
</script>

<style scoped></style>
