<template>
  <!-- A menu, or a fullscreen dialog on phones -->
  <component
    v-if="items.length > 1"
    :is="isPhone ? VDialog : VMenu"
    v-model="isOpen"
    v-bind="overlayProps"
  >
    <template #activator="{ props, isActive }">
      <BtnGroup v-bind="props" class="leaf-node-buttons">
        <!-- Only the icon on phones, the dialog shows the active name -->
        <v-btn
          v-if="isPhone"
          icon
          size="small"
          class="last-btn"
          :aria-label="`Leaf node: ${activeName}`"
        >
          <v-icon>mdi-filter-variant</v-icon>
        </v-btn>
        <template v-else>
          <v-icon class="leaf-node-buttons__icon">mdi-filter-variant</v-icon>
          <span class="leaf-node-buttons__label">{{ activeName }}</span>
          <v-btn
            icon
            size="small"
            class="last-btn"
            :aria-label="`Leaf node: ${activeName}`"
          >
            <v-icon>{{
              isActive ? 'mdi-chevron-up' : 'mdi-chevron-down'
            }}</v-icon>
          </v-btn>
        </template>
      </BtnGroup>
    </template>

    <v-card>
      <v-toolbar v-if="isPhone" :title="activeName" density="compact">
        <v-btn size="small" icon aria-label="Close" @click="isOpen = false">
          <v-icon size="small">mdi-close</v-icon>
        </v-btn>
      </v-toolbar>
      <v-list>
        <template v-for="item in items" :key="item.id">
          <v-list-item
            v-if="item.href"
            :href="item.href"
            :target="item.href ? '_blank' : undefined"
            @click="isOpen = false"
          >
            {{ item.name }}
            <template #append>
              <v-icon size="xsmall">{{ item.icon }}</v-icon>
            </template>
          </v-list-item>
          <v-list-item
            v-else
            :to="item.to"
            :active="item.id === activeNodeId"
            @click="selectItem(item.id)"
          >
            {{ item.name }}
            <template #append>
              <v-icon v-if="item.icon" size="xsmall">{{ item.icon }}</v-icon>
              <ThresholdSummaryChip
                :icon="item.thresholdIcon"
                :count="item.thresholdCount"
              />
            </template>
          </v-list-item>
        </template>
      </v-list>
    </v-card>
  </component>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useDisplay } from 'vuetify'
import { VDialog, VMenu } from 'vuetify/components'
import type { ColumnItem } from '@/components/general/ColumnItem'
import BtnGroup from '@/components/general/BtnGroup.vue'
import ThresholdSummaryChip from '@/components/thresholds/ThresholdSummaryChip.vue'

interface Props {
  items?: ColumnItem[]
}

const props = withDefaults(defineProps<Props>(), {
  items: () => [],
})

const activeNodeId = defineModel<string>('activeNodeId', { required: true })

const { xs } = useDisplay()

const isOpen = ref(false)
// On phones the app bar is too narrow for the label, so only show the icon
// and open the list fullscreen
const isPhone = computed(() => xs.value)
const overlayProps = computed(() =>
  isPhone.value
    ? { fullscreen: true, transition: 'dialog-bottom-transition' }
    : {},
)

const activeName = computed(() => {
  const activeNode = props.items.find((item) => item.id === activeNodeId.value)
  return activeNode?.name ?? 'All'
})

function selectItem(id: string) {
  activeNodeId.value = id
  isOpen.value = false
}
</script>

<style scoped>
.leaf-node-buttons {
  cursor: pointer;
  min-width: 0;
}

.leaf-node-buttons__icon {
  margin-left: 10px;
}

.leaf-node-buttons__label {
  line-height: 40px;
  padding-left: 4px;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
