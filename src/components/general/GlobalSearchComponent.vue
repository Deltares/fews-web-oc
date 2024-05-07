<template>
  <v-dialog
    v-model="state.active"
    transition="dialog-top-transition"
    :fullscreen="mobile"
    scrollable
    :max-width="mobile ? undefined : '900'"
    class="align-start"
    @keydown.esc="state.active = false"
  >
    <v-card>
      <v-card-title class="pa-0">
        <v-toolbar class="px-1" density="compact">
          <v-text-field
            v-model="search"
            placeholder="Search for locations"
            variant="outlined"
            hide-details
            clearable
            density="compact"
            autofocus
          >
            <template v-slot:prepend-inner>
              <v-btn icon size="small">
                <v-icon>mdi-map-marker</v-icon>
              </v-btn>
            </template>
          </v-text-field>
          <v-btn icon="mdi-close" @click="state.active = false" />
        </v-toolbar>
      </v-card-title>
      <v-card-text class="pa-0">
        <v-data-iterator
          :items="state.items"
          :items-per-page="-1"
          :search="search"
        >
          <template v-slot:header> </template>
          <template v-slot:default="{ items }">
            <v-list density="compact">
              <v-list-item
                v-for="item in items"
                key="id"
                @click="itemClick(item.raw)"
                >{{ item.raw.name }}</v-list-item
              >
            </v-list>
          </template>
        </v-data-iterator>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { useGlobalSearchState } from '@/stores/globalSearch'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'

const { mobile } = useDisplay()
const state = useGlobalSearchState()
const search = ref('')
const router = useRouter()

function itemClick(item: any) {
  router.replace({ name: 'TopologySpatialTimeSeriesDisplay', params: { locationId: item.id } })
  state.active = false
}
</script>

<style scoped></style>
