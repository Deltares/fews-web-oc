<template>
  <component :is="layout">
    <router-view/>
  </component>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import Default from '@/layouts/Default.vue'
import Empty from '@/layouts/Empty.vue'

@Component({
  components: {
    Default,
    Empty
  }
})
export default class App extends Vue {
  get layout (): string {
    let layout = 'default'
    this.$route.matched.some(
      record => {
        if (record.meta.layout) layout = record.meta.layout
        return record.meta.layout
      }
    )
    return layout
  }
}
</script>

<style>
html, body {
  margin: 0px;
}
</style>
