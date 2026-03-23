<template>
  <v-list-item
    v-for="permission in permissions"
    :key="permission.id"
  >
    <template #prepend>
      <v-switch
        color="primary"
        :label="permission.id"
        hide-details
        :aria-label="`Permissions ${permission.id}`"
        :model-value="isEnabled(permission.id)"
        @update:model-value="
          (val) => togglePermission(permission.id, val ?? true)
        "
      >
      </v-switch>
    </template>
    <template v-slot:append>
      <v-btn
        color="grey-lighten-1"
        icon="mdi-information"
        variant="text"
        class="flex-0-0 align-self-center"
        @click="toggleFavorite(permission.id)"
        :aria-label="`favorite Permissions ${permission.id}`"
      >
        <v-icon>{{
          isFavorite(permission.id) ? 'mdi-star' : 'mdi-star-outline'
        }}</v-icon>
        <v-tooltip activator="parent" location="top"> Favorite </v-tooltip>
      </v-btn>
    </template>
  </v-list-item>
</template>

<script setup lang="ts">
import usePermissionExcludes from '@/services/usePermissionExcludes'

const { permissions, togglePermission, isEnabled, toggleFavorite, isFavorite } =
  usePermissionExcludes()
</script>
