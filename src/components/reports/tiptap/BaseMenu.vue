<template>
  <span>
    <v-btn-group class="mr-5">
      <v-tooltip bottom>
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            variant="plain"
            size="small"
            :disabled="disableUndo"
            @click="editor.chain().undo().run()"
          >
            <v-icon>mdi-undo-variant</v-icon>
          </v-btn>
        </template>
        <span>Undo</span>
      </v-tooltip>

      <v-tooltip bottom>
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            variant="plain"
            size="small"
            :disabled="disableRedo"
            @click="editor.chain().redo().run()"
          >
            <v-icon>mdi-redo-variant</v-icon>
          </v-btn>
        </template>
        <span>Redo</span>
      </v-tooltip>
    </v-btn-group>

    <v-btn-toggle :value="textFormat" multiple class="mr-5">
      <v-tooltip bottom>
        <template #activator="{ props }">
          <v-btn
            variant="plain"
            v-bind="props"
            size="small"
            value="bold"
            @click="editor.chain().focus().toggleBold().run()"
            :active="editor.isActive('bold')"
          >
            <v-icon>mdi-format-bold</v-icon>
          </v-btn>
        </template>
        <span>Bold</span>
      </v-tooltip>

      <v-tooltip bottom>
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            variant="plain"
            size="small"
            value="italic"
            @click="editor.chain().focus().toggleItalic().run()"
            :active="editor.isActive('italic')"
          >
            <v-icon>mdi-format-italic</v-icon>
          </v-btn>
        </template>
        <span>Cursive</span>
      </v-tooltip>

      <v-tooltip bottom>
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            variant="plain"
            size="small"
            value="underline"
            :active="editor.isActive('underline')"
            @click="editor.chain().focus().toggleUnderline().run()"
          >
            <v-icon>mdi-format-underline</v-icon>
          </v-btn>
        </template>
        <span>Underline</span>
      </v-tooltip>
    </v-btn-toggle>

    <v-btn-toggle class="mr-5">
      <v-tooltip bottom>
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            variant="plain"
            size="small"
            value="highlight"
            @click="editor.chain().focus().toggleHighlight().run()"
          >
            <v-icon>
              {{
                editor.isActive('highlight')
                  ? 'mdi-format-color-marker-cancel'
                  : 'mdi-format-color-highlight'
              }}
            </v-icon>
          </v-btn>
        </template>
        <span>Mark</span>
      </v-tooltip>
      <v-menu offset-y>
        <template #activator="{ props }">
          <v-tooltip bottom>
            <template #activator="{ props: tooltipProps }">
              <v-btn
                variant="plain"
                size="small"
                v-bind="{ ...props, ...tooltipProps }"
              >
                <v-icon>mdi-format-color-text</v-icon>
                <v-icon>mdi-chevron-down</v-icon>
              </v-btn>
            </template>
            <span>Text color</span>
          </v-tooltip>
        </template>
        <v-color-picker
          v-model="editor.getAttributes('textStyle').color"
          @update:modelValue="editor.chain().focus().setColor($event).run()"
          variant="flat"
          hide-inputs
          hide-sliders
          hide-canvas
          :swatches="swatches"
          swatches-max-height="400"
          show-swatches
        ></v-color-picker>
      </v-menu>
    </v-btn-toggle>

    <v-btn-toggle :value="textAlign" class="mr-5">
      <v-tooltip bottom>
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            variant="plain"
            size="small"
            value="left"
            @click="editor.chain().focus().setTextAlign('left').run()"
          >
            <v-icon>mdi-format-align-left</v-icon>
          </v-btn>
        </template>
        <span>Align left</span>
      </v-tooltip>
      <v-tooltip bottom>
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            variant="plain"
            size="small"
            value="center"
            @click="editor.chain().focus().setTextAlign('center').run()"
          >
            <v-icon>mdi-format-align-center</v-icon>
          </v-btn>
        </template>
        <span>Center</span>
      </v-tooltip>
      <v-tooltip bottom>
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            variant="plain"
            size="small"
            value="right"
            @click="editor.chain().focus().setTextAlign('right').run()"
          >
            <v-icon>mdi-format-align-right</v-icon>
          </v-btn>
        </template>
        <span>Align right</span>
      </v-tooltip>
      <v-tooltip bottom>
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            variant="plain"
            size="small"
            value="justify"
            @click="editor.chain().focus().setTextAlign('justify').run()"
          >
            <v-icon>mdi-format-align-justify</v-icon>
          </v-btn>
        </template>
        <span>Justify</span>
      </v-tooltip>
    </v-btn-toggle>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Editor } from '@tiptap/vue-3'

interface Props {
  editor: Editor
}

const props = defineProps<Props>()

const swatches = [
  ['#000000', '#7F7F7F', '#FFFFFF'],
  ['#D52B1E', '#E17000', '#F9E11E'],
  ['#39870B', '#007BC7', '#673327'],
  ['#42135F', '#C5B8CF', '#E3DCE7'],
  ['#A90161', '#E5B2CF', '#F2D9E7'],
  ['#CA005D', '#EFB2CE', '#F7D9E7'],
  ['#F092CD', '#FADEF0', '#FDEFF8'],
  ['#D52B1E', '#F2BFBB', '#F9DFDD'],
  ['#E17000', '#F6D4B2', '#FBEAD9'],
  ['#FFB611', '#FFE9B7', '#FFF4DC'],
  ['#F9E11E', '#FDF6BB', '#FEFBDD'],
  ['#673327', '#D1C1BE', '#E8E1DF'],
  ['#94710B', '#DFD4B5', '#EFEADA'],
  ['#275937', '#BECDC3', '#DFE6E1'],
  ['#39870B', '#C3DBB6', '#E1EDDB'],
  ['#777C01', '#D6D7B2', '#EBEBD9'],
  ['#76D2B6', '#D6F1E9', '#EBF8F4'],
  ['#02689B', '#CCE0F1', '#E5F0F9'],
  ['#007BC7', '#B3D7EE', '#D9EBF7'],
  ['#8ECAE7', '#DDEFF8', '#EEF7FB'],
]

const textFormat = computed(() =>
  ['bold', 'italic', 'underline', 'highlight'].filter((format) =>
    props.editor.isActive(format),
  ),
)

const textAlign = computed(() => {
  const active = ['left', 'center', 'right', 'justify'].filter((format) =>
    props.editor.isActive({ textAlign: format }),
  )
  return active[0]
})

const disableUndo = computed(() => !props.editor.can().undo())
const disableRedo = computed(() => !props.editor.can().redo())
</script>

<style scoped>
.align-right {
  float: right;
}
</style>
