<template>
  <div v-show="props.flag" >
    <v-icon :class="props.flagClass">mdi-flag-variant</v-icon>
    {{ props.flag }}
  </div>
  <div v-show="props.flagSource">
    <v-icon :class="props.flagClass">mdi-access-point</v-icon>
    {{ props.flagSource }}
  </div>
  <div v-show="props.user"><v-icon>mdi-account</v-icon> {{ props.user }}</div>
  <div v-show="props.comment">
    <v-icon>mdi-comment</v-icon> {{ props.comment }}
  </div>
</template>

<script setup lang="ts">
interface Props {
  flag?: string
  flagSource?: string
  flagClass?: string
  user?: string
  comment?: string
}

const props = withDefaults(defineProps<Props>(), {
  flag: '',
  flagSource: '',
  flagClass: '',
  user: '',
  comment: '',
})
</script>

<style scoped>
.FFFF00 {
  color: #ffff00;
}
.FF8000 {
  color: #ff8000;
}
.FF0000 {
  color: #ff0000;
}
.FFC800 {
  color: #ffc800;
}
.FFFFFF {
  color: #ffffff;
}
</style>
