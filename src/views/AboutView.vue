<template>
  <v-card class="home-card">
    <v-card-title class="justify-center">
      Welcome to the Delft-FEWS Web OC!
    </v-card-title>
    <v-card-text>
      Unfortunately, you do not have access
      <v-icon>mdi-emoticon-sad-outline</v-icon>
    </v-card-text>
    <v-list density="compact">
      <v-list-item
        v-for="(item, i) in items"
        :key="i"
        :value="item"
      >
        <template v-slot:prepend>
          <v-icon :icon="item.icon"></v-icon>
        </template>
        <v-list-item-title v-text="item.title"></v-list-item-title>
      </v-list-item>
    </v-list>
    <v-card-text>
      <v-row>
        <v-col cols="4"> WebOC </v-col>
        <v-col cols="6"> v{{ version }} </v-col>
      </v-row>
      <v-row>
        <v-col cols="4"> Web Service </v-col>
        <v-col cols="6">
          {{ webServiceVersion.implementation }} #{{
            webServiceVersion.buildNumber
          }}
          {{
            webServiceVersion.buildType === 'development' ? 'development' : ''
          }}
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="12">
          <a :href="webServiceUrl">{{ webServiceUrl }} </a>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import packageConfig from '../../package.json'
import { PiWebserviceProvider, Version } from '@deltares/fews-pi-requests'
import { onMounted } from 'vue'
import { useConfigStore } from '../stores/config.ts'
import { ComponentTypeEnum, WebOcComponent } from '../lib/fews-config/types.ts'

const version = ref(packageConfig.version)
const webServiceUrl = ref(
  'https://rwsos-dataservices-ont.avi.deltares.nl/iwp/test/FewsWebServices',
)
const webServiceVersion = ref<Version>({
  implementation: '',
  buildType: '',
  buildNumber: '',
  buildTime: '',
})
const store = useConfigStore()

function getMenuIcon(componentConfig: WebOcComponent): string {
  if (componentConfig.icon !== undefined) return componentConfig.icon
  switch (componentConfig.type) {
    case ComponentTypeEnum.DataViewer:
      return 'mdi-archive-search'
    case ComponentTypeEnum.SpatialDisplay:
      return 'mdi-map'
    case ComponentTypeEnum.SchematicStatusDisplay:
      return 'mdi-application-brackets-outline'
    case ComponentTypeEnum.TimeSeriesDisplay:
      return 'mdi-chart-sankey'
    case ComponentTypeEnum.SystemMonitor:
      return 'mdi-clipboard-list'
    default:
      return ''
  }
}

onMounted(async () => {
  const baseUrl =
    'https://rwsos-dataservices-ont.avi.deltares.nl/iwp/test/FewsWebServices'
  const webServiceProvider = new PiWebserviceProvider(baseUrl)
  webServiceVersion.value = await (
    await webServiceProvider.getVersion()
  ).version
})

const items = computed(() => {
  return Object.values(store.components).map((component: any) => {
    return {
      id: component.id,
      to: { name: component.type },
      title: component.title ?? '',
      icon: getMenuIcon(component),
    }
  })
})
</script>

<style scoped>
.home-card {
  margin: auto;
  margin-top: 5%;
  width: fit-content !important;
  height: fit-content !important;
}
</style>
