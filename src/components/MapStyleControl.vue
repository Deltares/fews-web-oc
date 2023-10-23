<template>
  <v-chip
    :color="backgroundColor"
    class="outer-chip"
  >
    <v-chip-group
      v-model="styleIndex"
      @change="onChangeSelection"
      active-class="primary--text"
    >
      <v-chip
        v-for="style in styles"
        :key="style.name"
        small
      >
        {{ style.name }}
      </v-chip>
    </v-chip-group>
  </v-chip>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

interface Style {
  url: string,
  name: string,
}

const styleDir = `${process.env.BASE_URL}mapbox/styles/`

@Component
export default class MapStyleControl extends Vue {
  styles: Style[] = [
    {
      name: 'Base',
      url: styleDir + 'base.json'
    },
    {
      name: 'Minimal',
      url: styleDir + 'minimal.json'
    }
  ]
  styleIndex = 0

  onChangeSelection(): void {
    this.$emit('update:style', this.styles[this.styleIndex].url)
  }

  get backgroundColor(): string {
    return this.$vuetify.theme.dark ? 'rgba(0,0,0,.5)' : 'rgba(255,255,255,.5)'
  }
}
</script>

<style scoped>
.outer-chip {
  backdrop-filter: blur(4px);
}

:deep(.v-chip__content) {
  font-size: 1rem;
}
</style>
