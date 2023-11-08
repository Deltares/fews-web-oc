<template>
  <v-container class="settings-container">
    <h1>Settings</h1>
    <div v-for="group in groups" :key="group">
      <h2>{{ group }}</h2>
      <v-card density="compact">
        <v-container>
          <v-row
            v-for="(setting, index) in store.listByGroup(group)"
            :key="index"
            :disabled="setting?.disabled"
          >
            <v-col class="d-flex align-self-center" cols="4">
              {{ setting.label }}
            </v-col>
            <v-col class="d-flex justify-end">
              <v-select
                v-if="setting.type === 'oneOfMultiple'"
                :label="setting.label"
                v-model="setting.value"
                :items="setting.items"
                :disabled="setting.disabled"
                variant="solo-filled"
                density="compact"
                item-title="value"
                item-value="value"
                :item-props="true"
                hide-details
                single-line
                flat
                @update:modelValue="onValueChange(setting)"
                class="flex-1-1-100"
              >
                <template v-slot:item="{ props }">
                  <v-list-item
                    v-bind="props"
                    :disabled="props?.disabled === true"
                  >
                    <template v-slot:prepend>
                      <v-icon>
                        {{ props.icon }}
                      </v-icon>
                    </template>
                  </v-list-item>
                </template>
              </v-select>
              <v-switch
                v-else-if="setting.type === 'boolean'"
                v-model="setting.value"
                color="primary"
                :disabled="setting.disabled"
                hide-details
                @update:modelValue="onValueChange(setting)"
                class="d-flex justify-end"
              >
              </v-switch>
              <v-btn
                color="grey-lighten-1"
                icon="mdi-information"
                variant="text"
                class="flex-0-0 align-self-center"
              >
                <v-icon @click="onFavoriteChange(setting)">{{
                  setting.favorite ? 'mdi-star' : 'mdi-star-outline'
                }}</v-icon>
                <v-tooltip activator="parent" location="top">
                  Favorite
                </v-tooltip>
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
