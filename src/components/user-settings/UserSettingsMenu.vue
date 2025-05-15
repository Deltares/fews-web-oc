<template>
  <v-menu left bottom :close-on-content-click="false" class="menu">
    <template v-slot:activator="{ props }">
      <v-btn icon v-bind="props" data-testid="fews-user-settings-button">
        <v-icon>mdi-cog</v-icon>
      </v-btn>
    </template>
    <v-list>
      <v-list-item
        v-for="(setting, index) in store.listFavorite"
        :key="index"
        :disabled="setting?.disabled"
      >
        <v-list-item-subtitle>{{ setting.label }} </v-list-item-subtitle>
        <v-list-item-action v-if="setting.type === 'oneOfMultiple'">
          <v-btn-toggle
            density="compact"
            class="my-2 multi-line-toggle"
            v-model="setting.value"
            mandatory
            @update:model-value="onValueChange(setting)"
          >
            <v-btn
              v-for="item of setting.items"
              :key="item.value"
              :value="item.value"
              :disabled="item.disabled"
              class="text-none"
            >
              <v-icon v-if="item.icon">{{ item.icon }}</v-icon>
              <span v-else>{{ item.title }}</span>
              <v-tooltip activator="parent" location="top">{{
                item.title
              }}</v-tooltip>
            </v-btn>
          </v-btn-toggle>
        </v-list-item-action>
        <v-list-item-action v-else-if="setting.type === 'boolean'">
          <v-switch
            density="compact"
            v-model="setting.value"
            color="primary"
            class="ml-3"
            :disabled="setting.disabled"
            @update:modelValue="onValueChange(setting)"
            hide-details
          >
          </v-switch>
        </v-list-item-action>
      </v-list-item>

      <v-divider />
      <UserSettingsDialog>
        <template #activator="{ props }">
          <v-list-item v-bind="props">All Settings ...</v-list-item>
        </template>
      </UserSettingsDialog>
    </v-list>
  </v-menu>
</template>

<script setup lang="ts">
import {
  type UserSettingsItem,
  useUserSettingsStore,
} from '@/stores/userSettings'
import UserSettingsDialog from './UserSettingsDialog.vue'

const store = useUserSettingsStore()

function onValueChange(item: UserSettingsItem) {
  store.add(item)
}
</script>

<style scoped>
.menu {
  position: relative;
  z-index: 10000;
}

.multi-line-toggle {
  width: 200px;
  flex-wrap: wrap;
}

.multi-line-toggle .v-btn {
  height: 36px !important;
}

:deep(.v-btn-group--density-compact.v-btn-group) {
  height: unset;
}
</style>
