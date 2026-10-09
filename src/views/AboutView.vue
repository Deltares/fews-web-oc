<template>
  <v-card class="home-card">
    <v-card-title class="d-flex align-center">
      {{ configStore.general.title ?? 'Delft-FEWS Web OC' }}
    </v-card-title>
    <v-card-text class="pa-0">
      <v-alert
        v-if="configStore.activeComponents.length === 0"
        type="error"
        variant="tonal"
        class="ma-4"
      >
        Unfortunately, you do not have access
        <v-icon>mdi-emoticon-sad-outline</v-icon>
      </v-alert>

      <!-- WebOC -->
      <div class="px-4 py-3">
        <div class="d-flex align-center">
          <v-icon icon="mdi-application-outline" class="mr-3" />
          <span class="text-body-1"> FEWS WebOC </span>
          <v-spacer />
          <div class="d-flex flex-wrap justify-end ga-2">
            <v-chip size="small" prepend-icon="mdi-tag-outline">
              {{ version }}
            </v-chip>

            <v-chip
              v-if="commitHash !== ''"
              size="small"
              prepend-icon="mdi-source-commit"
            >
              {{ commitHash }}
            </v-chip>

            <v-chip
              v-if="commitHash !== ''"
              size="small"
              prepend-icon="mdi-package-variant-closed"
            >
              {{ buildDate }}
            </v-chip>
          </div>
        </div>
      </div>
      <v-divider />
      <!-- Web Service -->
      <div class="px-4 py-3">
        <div class="d-flex align-center">
          <v-icon icon="mdi-server-outline" class="mr-3" />
          <span class="text-body-1"> FEWS Web Services </span>
          <v-spacer />
          <div class="d-flex flex-wrap justify-end ga-2">
            <v-chip size="small" prepend-icon="mdi-tag-outline">
              {{ webServiceVersion.implementation }}
            </v-chip>
            <v-chip size="small" prepend-icon="mdi-package-variant-closed">
              #{{ webServiceVersion.buildNumber }}
            </v-chip>
            <v-chip
              v-if="webServiceVersion.buildType === 'development'"
              size="small"
              prepend-icon="mdi-source-branch"
            >
              development
            </v-chip>
          </div>
        </div>
        <div class="text-body-1 ml-8 mt-2">
          <a :href="webServiceUrl" target="_blank">
            {{ webServiceUrl }}
          </a>
        </div>
      </div>
      <v-divider />
      <ExcludedPermissionsControl />
      <MicroFrontendOverview />
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { version as packageVersion } from '../../package.json'
import { PiWebserviceProvider, Version } from '@deltares/fews-pi-requests'
import { useConfigStore } from '../stores/config.ts'
import { configManager } from '@/services/application-config'
import { createTransformRequestFn } from '@/lib/requests/transformRequest'

import ExcludedPermissionsControl from '@/components/permissions/ExcludedPermissionsControl.vue'
import MicroFrontendOverview from '@/components/microfrontend/MicroFrontendOverview.vue'

const webServiceUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')

const version = ref(packageVersion)
const commitHash = __GIT_TAG__ ? '' : __GIT_HASH__
const buildDate = new Date(__BUILD_DATE__).toISOString()

const webServiceVersion = ref<Version>({
  implementation: '',
  buildType: '',
  buildNumber: '',
  buildTime: '',
})
const configStore = useConfigStore()

onMounted(async () => {
  const webServiceProvider = new PiWebserviceProvider(webServiceUrl, {
    transformRequestFn: createTransformRequestFn(),
  })
  webServiceVersion.value = await (
    await webServiceProvider.getVersion()
  ).version
})
</script>

<style scoped>
.home-card {
  margin: auto;
  margin-top: 5%;
  width: 800px;
  max-width: 100%;
  height: fit-content !important;
}
</style>
