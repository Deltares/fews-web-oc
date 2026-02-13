<template>
  <v-card-text class="flex-grow-1 overflow-y-auto">
    <v-list-item v-for="permission in permissions" :key="permission.id">
      <v-switch
        color="primary"
        :label="permission.id"
        hide-details
        :disabled="!permission.assigned"
        :aria-label="`${permission.id}`"
        v-model="permission.used"
      >
      </v-switch>
    </v-list-item>
  </v-card-text>
</template>

<script setup lang="ts">
import usePermissionExcludes from '@/services/usePermissionExcludes'

const { getPermissions } = usePermissionExcludes()

const permissions = await getPermissions()
</script>
