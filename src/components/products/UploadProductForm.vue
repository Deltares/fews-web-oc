<template>
  <tr>
    <td colspan="100%" class="py-2">
      <v-form ref="formRef" @submit.prevent="onSubmit">
        <v-card flat>
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
                  validate-on="submit"
                  :rules="[(v) => !!v || 'File is required']"
                  accept=".html,.pdf,.png,.jpg,.jpeg,.gif"
                />
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
                  hide-details="auto"
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
                  hide-details="auto"
                  density="compact"
                />
              </v-col>
            </v-row>
            <v-row v-if="type === 'upload'">
              <v-col cols="12">
                <v-text-field
                  v-model="author"
                  label="Author"
                  variant="outlined"
                  :rules="[(v) => !!v || 'Author name is required']"
                  hide-details="auto"
                  density="compact"
                ></v-text-field>
              </v-col>
            </v-row>
          </v-container>
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
              :loading="isSaving"
              type="submit"
              :text="type === 'upload' ? 'Upload' : 'Create'"
            />
          </v-card-actions>
        </v-card>
      </v-form>
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
import { ref, useTemplateRef } from 'vue'

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

const file = ref<File>()

const name = ref(props.name ?? '')
const author = ref(props.author ?? '')
const selectedCompose = ref(props.compose?.[0])
const isSaving = ref(false)
const formRef = useTemplateRef('formRef')

async function onSubmit() {
  if (!formRef.value) {
    console.error('Form reference is not available')
    return
  }

  const { valid } = await formRef.value.validate()
  if (valid) {
    onSave()
  }
}

async function onSave() {
  isSaving.value = true
  try {
    switch (props.type) {
      case 'upload':
        await uploadProduct(
          name.value,
          author.value,
          props.areaId,
          props.sourceId,
          file.value,
        )
        break
      case 'new':
        const compose = selectedCompose.value
        await createNewProduct(
          compose?.archiveProduct.name ?? '',
          author.value,
          compose?.archiveProduct,
          compose?.template,
          props.viewPeriod,
        )
        break
    }
  } catch (error) {
    console.error('Error saving product:', error)
  } finally {
    isSaving.value = false
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

  const archiveProductAttributes: Record<string, string> = {}
  archiveProduct.attributes?.forEach((attr) => {
    if (attr.key && attr.value) {
      archiveProductAttributes[attr.key] = attr.value
    }
  })

  const attributesForProvidedValues = {
    ...(author && { author }),
    ...(name && { name }),
    ...(productId && { productId }),
  }

  const attributes = {
    ...attributesForProvidedValues,
    ...archiveProductAttributes,
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
