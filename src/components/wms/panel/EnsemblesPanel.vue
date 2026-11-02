<template>
  <v-list-item prepend-icon="mdi-sitemap">
    <div class="d-flex align-center ga-2">
      <v-select
        v-if="selectableEnsembles.length > 1"
        v-model="selectedEnsembleId"
        :items="selectableEnsembles"
        item-value="ensembleId"
        item-title="ensembleId"
        :aria-label="t('ensembles.ensemble')"
        variant="solo-filled"
        flat
        density="compact"
        hide-details
        class="ensemble-select"
      />
      <span v-else class="ensemble-label text-truncate">
        {{ selectedEnsembleId }}
      </span>
      <template v-if="isNumericMembers">
        <NumberStepperField
          v-model="memberText"
          :aria-label="t('ensembles.member')"
          :size="4"
          :height="36"
          class="member-input"
          @step="stepMember"
          @blur="commitMemberText"
          @keydown="onMemberKeydown"
        />
        <span class="member-total text-no-wrap">
          {{ t('ensembles.ofTotal', { total: ensembleMemberIds.length }) }}
        </span>
      </template>
      <v-select
        v-else
        v-model="selectedEnsembleMemberId"
        :items="ensembleMemberIds"
        :aria-label="t('ensembles.member')"
        variant="solo-filled"
        flat
        density="compact"
        hide-details
        class="member-input member-select"
      />
    </div>
  </v-list-item>
</template>

<script setup lang="ts">
import type { Ensemble } from '@deltares/fews-wms-requests'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import NumberStepperField from '@/components/general/NumberStepperField.vue'
import type { EnsembleSelection } from '@/lib/ensemble'

const { t } = useI18n()

interface Props {
  ensembles: Ensemble[]
}
const props = defineProps<Props>()

const selection = defineModel<EnsembleSelection | null>({ required: true })

const selectedEnsembleId = ref<string | null>(null)
const selectedEnsembleMemberId = ref<string | null>(null)

// Ensembles without members cannot be selected.
const selectableEnsembles = computed(() =>
  props.ensembles.filter((ensemble) => ensemble.ensembleMemberIds.length > 0),
)

const selectedEnsemble = computed<Ensemble | null>(() => {
  if (selectedEnsembleId.value === null) return null
  const ensemble = props.ensembles.find(
    (ensemble) => ensemble.ensembleId === selectedEnsembleId.value,
  )
  return ensemble ?? null
})

const ensembleMemberIds = computed(() => {
  return selectedEnsemble.value?.ensembleMemberIds ?? []
})

// Ensemble member IDs are usually integers, in which case we show a number
// input instead of a select.
const memberNumbers = computed(() =>
  ensembleMemberIds.value.map((memberId) =>
    /^-?\d+$/.test(memberId) ? parseInt(memberId) : NaN,
  ),
)
const isNumericMembers = computed(
  () =>
    memberNumbers.value.length > 0 &&
    memberNumbers.value.every((memberNumber) => !Number.isNaN(memberNumber)),
)

const selectedEnsembleMemberNumber = computed<number | null>({
  get: () => {
    const index = ensembleMemberIds.value.indexOf(
      selectedEnsembleMemberId.value ?? '',
    )
    return memberNumbers.value[index] ?? null
  },
  set: (newNumber) => {
    const oldNumber = selectedEnsembleMemberNumber.value
    if (newNumber === null || oldNumber === null) return
    // Member numbers need not be contiguous, so pick the nearest existing
    // member in the direction of the change.
    const candidates =
      newNumber >= oldNumber
        ? memberNumbers.value.filter((number) => number >= newNumber)
        : memberNumbers.value.filter((number) => number <= newNumber)
    if (candidates.length === 0) return
    const nearest =
      newNumber >= oldNumber ? Math.min(...candidates) : Math.max(...candidates)
    const index = memberNumbers.value.indexOf(nearest)
    selectedEnsembleMemberId.value = ensembleMemberIds.value[index] ?? null
  },
})

// Text in the member input: the selected member, or the text being typed until
// it is committed on enter or blur.
const editedMemberText = ref<string | null>(null)
const memberText = computed<string>({
  get: () =>
    editedMemberText.value ?? String(selectedEnsembleMemberNumber.value ?? ''),
  set: (text) => {
    editedMemberText.value = text
  },
})

function stepMember(direction: 1 | -1) {
  editedMemberText.value = null
  const memberNumber = selectedEnsembleMemberNumber.value
  if (memberNumber === null) return
  selectedEnsembleMemberNumber.value = memberNumber + direction
}

function commitMemberText() {
  const text = memberText.value.trim()
  if (/^-?\d+$/.test(text)) {
    selectedEnsembleMemberNumber.value = parseInt(text)
  }
  // Show the actual member, e.g. after invalid input or a non-existent member.
  editedMemberText.value = null
}

function onMemberKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    commitMemberText()
  } else if (e.key === 'Escape') {
    editedMemberText.value = null
  }
}

// Only update the model value when the selection has actually changed, to
// avoid triggering watchers (and layer reloads) on the model with an identical
// selection.
function updateSelection(ensembleId: string, ensembleMemberId: string) {
  if (
    selection.value?.ensembleId === ensembleId &&
    selection.value?.ensembleMemberId === ensembleMemberId
  ) {
    return
  }
  selection.value = { ensembleId, ensembleMemberId }
}

// Update the model value based on the select fields and vice versa.
watch(selectedEnsembleId, (newSelectedEnsembleId) => {
  if (newSelectedEnsembleId === null) return

  const firstEnsembleMemberId = ensembleMemberIds.value[0]
  if (firstEnsembleMemberId === undefined) {
    // This ensemble has no members, so it cannot be selected; revert the
    // select field to the ensemble that is actually selected.
    selectedEnsembleId.value = selection.value?.ensembleId ?? null
    return
  }

  // Check whether our current ensemble member ID exists in this ensemble, in
  // that case, preserve it.
  const oldMemberId = selectedEnsembleMemberId.value
  const hasOldMemberId =
    oldMemberId !== null && ensembleMemberIds.value.includes(oldMemberId)
  const newSelectedEnsembleMemberId = hasOldMemberId
    ? oldMemberId
    : firstEnsembleMemberId
  updateSelection(newSelectedEnsembleId, newSelectedEnsembleMemberId)
})
watch(selectedEnsembleMemberId, (newSelectedEnsembleMemberId) => {
  if (
    selectedEnsembleId.value === null ||
    newSelectedEnsembleMemberId === null
  ) {
    return
  }
  updateSelection(selectedEnsembleId.value, newSelectedEnsembleMemberId)
})

watch(
  selection,
  (newSelection) => {
    // Don't change the selected values if our new selection is null, it is e.g.
    // an incomplete selection while we are choosing member ID having selected
    // ensemble ID.
    if (newSelection === null) return

    if (newSelection.ensembleId !== selectedEnsembleId.value) {
      selectedEnsembleId.value = newSelection.ensembleId
    }
    if (newSelection.ensembleMemberId !== selectedEnsembleMemberId.value) {
      selectedEnsembleMemberId.value = newSelection.ensembleMemberId
    }
  },
  { immediate: true },
)
</script>

<style scoped>
.ensemble-select,
.ensemble-label {
  flex: 1 1 0;
  min-width: 0;
}

.member-input {
  flex: 0 0 auto;
}

.member-select {
  width: 130px;
}
</style>
