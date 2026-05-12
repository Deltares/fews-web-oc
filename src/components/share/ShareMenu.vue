<template>
  <div class="pa-4 h-100 overflow-auto">
    <div class="d-flex flex-column ga-4">
      <div class="d-flex ga-2">
        <v-btn-toggle v-model="embedType" density="compact" border mandatory>
          <v-btn
            value="link"
            :text="t('share.link')"
            prepend-icon="mdi-link-variant"
          />
          <v-btn
            value="iframe"
            :text="t('share.iframe')"
            prepend-icon="mdi-code-tags"
          />
        </v-btn-toggle>
        <v-btn-toggle
          v-if="routeHasMap"
          v-model="viewType"
          density="compact"
          border
          mandatory
        >
          <v-btn value="map" :text="t('share.map')" prepend-icon="mdi-map" />
          <v-btn
            value="chart"
            :text="t('share.chart')"
            prepend-icon="mdi-chart-line"
            :class="{ disabled: !routeHasChart }"
          />
        </v-btn-toggle>
      </div>
      <CopyUrlField :url />
      <div v-if="embedType === 'iframe'" class="d-flex ga-2">
        <v-number-input
          v-model.number="iframeWidth"
          :min="0"
          :step="100"
          label="Width"
          density="compact"
          hide-details
          variant="outlined"
        />
        <v-number-input
          v-model.number="iframeHeight"
          :min="0"
          :step="100"
          label="Height"
          density="compact"
          hide-details
          variant="outlined"
        />
      </div>
    </div>

    <v-card flat border class="my-4">
      <v-toolbar density="compact">
        <v-switch
          v-model="applySettings"
          :label="t('share.applySettings')"
          class="ms-4"
          color="primary"
          hide-details
        />
      </v-toolbar>
      <v-divider />

      <v-list v-if="applySettings" density="compact" class="py-0">
        <v-list-group v-for="group in store.groups" :key="group.id">
          <template #activator="{ props }">
            <v-list-item
              v-bind="props"
              :title="group.title"
              :prepend-icon="group.icon"
            />
          </template>

          <template
            v-for="setting in getSettingsByGroup(group.id)"
            :key="setting.id"
          >
            <UserSettingsOneOfMultiple
              v-if="setting.type === 'oneOfMultiple'"
              v-model="setting.value"
              :setting="setting"
              inline
            />

            <UserSettingsBoolean
              v-else-if="setting.type === 'boolean'"
              v-model="setting.value"
              :setting="setting"
              inline
            />
          </template>
        </v-list-group>
      </v-list>
    </v-card>
  </div>
</template>

<script lang="ts" setup>
import CopyUrlField from './CopyUrlField.vue'
import { useRoute, useRouter } from 'vue-router'

import UserSettingsBoolean from '@/components/user-settings/UserSettingsBoolean.vue'
import UserSettingsOneOfMultiple from '@/components/user-settings/UserSettingsOneOfMultiple.vue'
import { useUserSettingsStore } from '@/stores/userSettings'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const route = useRoute()
const router = useRouter()
const store = useUserSettingsStore()
const { t } = useI18n()

const applySettings = ref(false)
const embedType = ref<'link' | 'iframe'>('link')
const viewType = ref<'map' | 'chart'>('map')
const settings = ref(store.items.map((item) => ({ ...item })))

function getSettingsByGroup(groupId: string) {
  return settings.value.filter((s) => s.group === groupId)
}

const routeHasMap = computed(() => {
  return (
    typeof route.name === 'string' &&
    route.name.startsWith('TopologySpatialDisplay')
  )
})

const routeHasChart = computed(() => {
  return (
    route.params.locationIds !== undefined ||
    route.params.latitude !== undefined ||
    route.params.longitude !== undefined
  )
})

watch(routeHasChart, (newValue) => {
  if (!newValue && viewType.value === 'chart') {
    viewType.value = 'map'
  }
})

const embedUrl = computed(() => {
  const newRoute = {
    name: route.name,
    params: { ...route.params },
    query: { ...route.query },
  }

  newRoute.params['embed'] = 'embed'

  if (applySettings.value) {
    settings.value.forEach((setting) => {
      if (setting.type === 'boolean') {
        newRoute.query[setting.id] = setting.value ? 'true' : 'false'
      } else if (setting.type === 'oneOfMultiple') {
        newRoute.query[setting.id] = setting.value
      }
    })
  }

  if (
    routeHasMap.value &&
    viewType.value === 'chart' &&
    typeof route.name === 'string'
  ) {
    newRoute.name = route.name.replace(
      'TopologySpatialDisplay',
      'TopologySpatialTimeSeriesDisplay',
    )
  }

  const href = router.resolve(newRoute).href

  return new URL(href, window.location.origin).toString()
})

const iframeWidth = ref(600)
const iframeHeight = ref(400)

const url = computed(() => {
  switch (embedType.value) {
    case 'link':
      return embedUrl.value
    case 'iframe':
      return `<iframe src="${embedUrl.value}" width="${iframeWidth.value}" height="${iframeHeight.value}" frameborder="0" allowfullscreen></iframe>`
  }
})
</script>

<style scoped>
:deep(.v-list-group__items .v-list-item) {
  --indent-padding: 0px;
}

.disabled {
  pointer-events: none;
  opacity: var(--v-disabled-opacity);
}
</style>
