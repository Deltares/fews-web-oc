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
import type { ArchiveProduct, DocumentCompose } from '@/lib/products'
import {
  fetchLatestArchiveProduct,
  fetchProduct,
  postFileProduct,
  postProduct,
} from '@/lib/products/requests'
import { IntervalItem } from '@/lib/TimeControl/interval'
import { configManager } from '@/services/application-config'
import { hashObject } from '@/services/useProducts'
import { DateTime } from 'luxon'
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
const selectedCompose = ref(props.compose?.[0])

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
      const compose = selectedCompose.value
      createNewProduct(
        compose?.archiveProduct.name ?? '',
        author.value,
        compose?.archiveProduct,
        compose?.template,
        props.viewPeriod,
      )
      break
  }

  emit('saved')
  emit('close')
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
  archiveProduct: ArchiveProduct | undefined,
  template: ArchiveProduct | undefined,
  viewPeriod: IntervalItem,
) {
  if (!template) {
    console.error('No template selected for new product')
    return
  }

  if (!archiveProduct) {
    console.error('No archive product provided for new product')
    return
  }

  if (!archiveProduct.areaId) {
    console.error('No areaId in archive product for new product')
    return
  }

  if (!archiveProduct.sourceId) {
    console.error('No sourceId in archive product for new product')
    return
  }

  const templateMetaData = await fetchLatestArchiveProduct(
    piUrl,
    template,
    viewPeriod,
  )

  if (!templateMetaData) {
    console.error('No template metadata found for new product')
    return
  }

  const htmlContent = await fetchProduct(piUrl, templateMetaData)

  const productId = archiveProduct.id

  const attributes: Record<string, string> = {}
  archiveProduct.attributes?.forEach((attr) => {
    if (attr.key && attr.value) {
      attributes[attr.key] = attr.value
    }
  })

  if (!('author' in attributes) && author) {
    attributes['author'] = author
  }

  if (!('name' in attributes) && name) {
    attributes['name'] = name
  }

  if (!('productId' in attributes) && productId) {
    attributes['productId'] = productId
  }

  const fileName =
    templateMetaData.relativePathProducts[0].split('/').pop() ?? 'unknown'

  const timeZero = DateTime.now().toUTC().startOf('second').toISO({
    suppressMilliseconds: true,
  })

  await postProduct(
    archiveUrl,
    archiveProduct.areaId,
    archiveProduct.sourceId,
    archiveProduct.timeZero ?? timeZero,
    htmlContent,
    fileName,
    attributes,
  )
}
</script>
