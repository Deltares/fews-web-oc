<template>
  <Teleport to="#secondary-side-panel-end">
    <div
      v-if="warningLevelsStore.warningLevels.length"
      class="threshold-summary-container border-s"
    >
      <div class="threshold-summary-top" id="threshold-summary-top"></div>
      <v-list
        v-model:selected="warningLevelsStore.selectedWarningLevelIds"
        select-strategy="leaf"
        class="threshold-summary-center"
        lines="two"
      >
        <v-list-item
          v-for="warningLevel in warningLevelsStore.warningLevels"
          :key="warningLevel.id"
          :value="warningLevel.id"
          label
          size="small"
          density="compact"
          class="ma-0 py-3 px-0 w-100 flex-nowrap overflow-hidden"
        >
          <div class="d-flex align-center flex-column flex-nowrap px-1">
            <v-badge
              :model-value="(warningLevel.count ?? 0) > 0"
              location="top end"
              offset-x="5"
              offset-y="1"
              color="transparent"
            >
              <template #badge>
                <v-chip size="small" density="compact" class="pa-0 px-1">{{
                  warningLevel.count
                }}</v-chip>
              </template>
              <v-img width="30px" :src="warningLevel.icon"></v-img>
            </v-badge>
            <v-list-item-subtitle>
              {{ warningLevel.name }}
            </v-list-item-subtitle>
          </div>
        </v-list-item>
      </v-list>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { useWarningLevelsStore } from '@/stores/warningLevels'

interface Props {
  nodeId?: string
}

const props = defineProps<Props>()
const warningLevelsStore = useWarningLevelsStore()

watch(
  () => props.nodeId,
  () => {
    warningLevelsStore.setTopologyNodeId(props.nodeId)
  },
)
</script>

<style scoped>
.threshold-summary-container {
  width: 65px;
  display: grid;
  grid-template-rows: 1fr auto 1fr;
  height: 100%;
}

.threshold-summary-top {
  grid-row: 1;
  height: 36px;
  display: flex;
  justify-content: center;
}

.threshold-summary-center {
  grid-row: 2;
  height: 100%;
  align-self: center;
}

.warning-count {
  text-align: center;
}

.v-list-item-subtitle {
  font-size: 0.8em;
  color: var(--v-theme-on-surface);
  opacity: 1;
}

:deep(.v-list-item__content) {
  overflow: visible !important;
}

:deep(.v-chip__content) {
  width: 100%;
}
</style>
