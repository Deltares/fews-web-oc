<template>
  <v-container class="settings-container">
    <h1>Settings</h1>
    <div v-for="group in groups" :key="group">
      <v-card density="compact">
        <v-card-title>{{ group }}</v-card-title>
        <v-container>
          <v-row
            v-for="(setting, index) in store.listByGroup(group)"
            :key="index"
            :disabled="setting?.disabled"
          >
            <v-col class="d-flex">
              <v-select
                v-if="setting.type === 'oneOfMultiple'"
                :label="setting.label"
                v-model="setting.value"
                :items="setting.items"
                :disabled="setting.disabled"
                variant="solo"
                density="compact"
                item-title="value"
                item-value="value"
                item-disabled="disabled"
                @update:modelValue="onValueChange(setting)"
                class="flex-1-1-100"
              >
              </v-select>
              <v-switch
                v-else-if="setting.type === 'boolean'"
                :label="setting.label"
                v-model="setting.value"
                color="primary"
                :disabled="setting.disabled"
                @update:modelValue="onValueChange(setting)"
              >
              </v-switch>
              <v-btn
                color="grey-lighten-1"
                icon="mdi-information"
                variant="text"
                class="flex-0-0"
              >
                <v-icon @click="onFavoriteChange(setting)">{{
                  setting.favorite ? 'mdi-star' : 'mdi-star-outline'
                }}</v-icon>
              </v-btn>
            </v-col>
          </v-row>
        </v-container>
      </v-card>
    </div>
  </v-container>
</template>

<script setup lang="ts">
import { UserSettingsItem, useUserSettingsStore } from '../stores/userSettings'
import { computed } from 'vue'

const store = useUserSettingsStore()
const groups = computed(() => store.listGroups)

const onValueChange = (item: UserSettingsItem) => {
  store.add(item)
}

const onFavoriteChange = (item: UserSettingsItem) => {
  item.favorite = !item.favorite
  onValueChange(item)
}
</script>

<style scoped>
.settings-container {
  display: flex;
  flex-direction: column;
  row-gap: 20px;
  justify-content: space-between;
}
</style>
