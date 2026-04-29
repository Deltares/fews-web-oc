<template>
  <tr>
    <td colspan="100%" class="py-2">
      <v-card flat>
        <v-form v-model="formIsValid">
          <v-container>
            <v-row v-if="type === 'upload'">
              <v-col cols="12">
                <v-file-input
                  v-model="file"
                  :height="10"
                  label="Upload file"
                  hide-details="auto"
                  variant="plain"
                  density="compact"
                  :rules="[(v) => !!v || 'File is required']"
                  accept=".html,.pdf,.png,.jpg,.jpeg,.gif"
                >
                </v-file-input>
              </v-col>
            </v-row>
            <v-row v-if="type === 'new'">
              <v-col cols="12">
                <v-select
                  v-model="selectedCompose"
                  :items="compose"
                  :item-title="(item) => item.template.name"
                  label="Select Template"
                  variant="outlined"
                  return-object
                  :rules="[(v) => !!v || 'Template is required']"
                  hide-details
                  density="compact"
                />
              </v-col>
            </v-row>
            <v-row v-if="type === 'upload'">
              <v-col cols="12">
                <v-text-field
                  v-model="name"
                  label="Product Name"
                  variant="outlined"
                  :rules="[(v) => !!v || 'Product name is required']"
                  hide-details
                  density="compact"
                ></v-text-field>
              </v-col>
            </v-row>
            <v-row v-if="type === 'upload'">
              <v-col cols="12">
                <v-text-field
                  v-model="author"
                  label="Author"
                  variant="outlined"
                  :rules="[(v) => !!v || 'Author name is required']"
                  hide-details
                  density="compact"
                ></v-text-field>
              </v-col>
            </v-row>
          </v-container>
        </v-form>
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="flat"
            size="small"
            @click="emit('close')"
            text="Cancel"
          />
          <v-btn
            variant="flat"
            color="primary"
            size="small"
            :disabled="!formIsValid"
            @click="onSave()"
            :text="type === 'upload' ? 'Upload' : 'Create'"
          />
        </v-card-actions>
      </v-card>
    </td>
  </tr>
</template>

<script setup lang="ts">
import type { DocumentCompose } from '@/lib/products'
import { uploadProduct } from '@/lib/products/uploadProduct'
import { createNewProduct } from '@/lib/products/createNewProduct'
import { IntervalItem } from '@/lib/TimeControl/interval'
import { configManager } from '@/services/application-config'
import { ref } from 'vue'

interface Props {
  type: 'new' | 'upload'
  name?: string
  author?: string
  areaId?: string
  sourceId?: string
  compose?: DocumentCompose[]
  viewPeriod: IntervalItem
}

const {
  name = '',
  author = '',
  compose,
  areaId,
  sourceId,
  viewPeriod,
  type,
} = defineProps<Props>()

interface Emits {
  (e: 'saved'): void
  (e: 'close'): void
}
const emit = defineEmits<Emits>()

const formIsValid = ref(false)
const file = ref<File>()

const selectedCompose = ref(compose?.[0])

const piUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')

async function onSave() {
  switch (type) {
    case 'upload':
      await uploadProduct(piUrl, name, author, areaId, sourceId, file.value)
      break
    case 'new':
      const compose = selectedCompose.value
      await createNewProduct(
        piUrl,
        compose?.archiveProduct.name ?? '',
        author,
        compose?.archiveProduct,
        compose?.template,
        viewPeriod,
      )
      break
  }

  emit('saved')
  emit('close')
}
</script>
