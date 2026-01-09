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
                  v-model="selectedTemplate"
                  :items="templates"
                  item-title="attributes.name"
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
            <v-row>
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
            <v-row v-if="selectedTemplate?.timeZero">
              <v-col cols="12">
                <v-text-field
                  readonly
                  v-model="selectedTemplate.timeZero"
                  label="Time"
                  variant="outlined"
                  :rules="[(v) => !!v || 'Time is required']"
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
            text="Save"
          />
        </v-card-actions>
      </v-card>
    </td>
  </tr>
</template>

<script setup lang="ts">
import {
  fetchProduct,
  postFileProduct,
  postProduct,
} from '@/lib/products/requests'
import { configManager } from '@/services/application-config'
import { hashObject } from '@/services/useProducts'
import { ProductMetaDataType } from '@/services/useProducts/types'
import { DateTime } from 'luxon'
import { ref } from 'vue'

interface Props {
  type: 'new' | 'upload'
  name?: string
  author?: string
  areaId?: string
  sourceId?: string
  templates?: ProductMetaDataType[]
}

const props = defineProps<Props>()

interface Emits {
  (e: 'saved'): void
  (e: 'close'): void
}
const emit = defineEmits<Emits>()

const formIsValid = ref(false)
const file = ref<File>()

const name = ref(props.name ?? '')
const author = ref(props.author ?? '')
const selectedTemplate = ref(props.templates?.[0])

async function onSave() {
  switch (props.type) {
    case 'upload':
      uploadProduct(
        name.value,
        author.value,
        props.areaId,
        props.sourceId,
        file.value,
      )
      break
    case 'new':
      createNewProduct(name.value, author.value, selectedTemplate.value)
      break
  }

  emit('saved')
}

const piUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const archiveUrl = `${piUrl}rest/fewspiservice/v1/archive/`

async function uploadProduct(
  name: string,
  author: string,
  areaId: string | undefined,
  sourceId: string | undefined,
  file: File | undefined,
) {
  if (!file) {
    console.error('No file selected for upload')
    return
  }

  if (!areaId) {
    console.error('No areaId provided for upload')
    return
  }

  if (!sourceId) {
    console.error('No sourceId provided for upload')
    return
  }

  const formInput = {
    name,
    author,
  }
  const productId = await hashObject(formInput)
  const attributes = {
    ...formInput,
    productId,
  }

  const timeZero = DateTime.now().toUTC().startOf('second').toISO({
    suppressMilliseconds: true,
  })

  await postFileProduct(
    archiveUrl,
    areaId,
    sourceId,
    timeZero,
    file,
    attributes,
  )
}

async function createNewProduct(
  name: string,
  author: string,
  template: ProductMetaDataType | undefined,
) {
  if (!template) {
    console.error('No template selected for new product')
    return
  }

  const htmlContent = await fetchProduct(piUrl, template)

  const productId = template.attributes.productId.replace(/^template_/, '')
  const attributes = {
    ...template.attributes,
    author,
    name,
    productId,
  }
  const fileName =
    template.relativePathProducts[0].split('/').pop() ?? 'unknown'

  await postProduct(
    archiveUrl,
    template.areaId,
    template.sourceId,
    template.timeZero,
    htmlContent,
    fileName,
    attributes,
  )
}
</script>
