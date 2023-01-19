<template>
  <v-btn-toggle
    v-model="selectedIndex"
    @change="selectTheme"
    dense
    mandatory
  >
    <v-tooltip
      v-for="option in options"
      :key="option.id"
      open-delay="400"
      bottom
    >
      <template v-slot:activator="{ on, attrs }">
        <v-btn
          v-bind="attrs"
          v-on="on"
        >
          <v-icon>{{ option.icon }}</v-icon>
        </v-btn>
      </template>
      <span>{{ option.tooltip }} </span>
    </v-tooltip>
  </v-btn-toggle>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import { ColourTheme } from '@/lib/Theme'

interface ThemeOption {
  id: string
  theme: ColourTheme
  icon: string
  tooltip: string
}

@Component
export default class ThemeSelector extends Vue {
  @Prop({ default: () => ColourTheme.Auto }) value!: ColourTheme
  selectedIndex: number = 0

  options: ThemeOption[] = [
    {
      id: 'auto',
      theme: ColourTheme.Auto,
      icon: 'mdi-theme-light-dark',
      tooltip: 'Select theme automatically'
    },
    {
      id: 'light',
      theme: ColourTheme.Light,
      icon: 'mdi-weather-sunny',
      tooltip: 'Select light theme'
    },
    {
      id: 'dark',
      theme: ColourTheme.Dark,
      icon: 'mdi-weather-night',
      tooltip: 'Select dark theme'
    }
  ]

  mounted() {
    this.onValueChange()
  }

  selectTheme() {
    this.$emit('input', this.options[this.selectedIndex].theme)
  }

  @Watch('value')
  onValueChange() {
    const index = this.options.findIndex(option => option.theme === this.value)
    // If we specify a theme that we cannot find, fall back to the first option.
    this.selectedIndex = index < 0 ? 0 : index
  }
}
</script>
