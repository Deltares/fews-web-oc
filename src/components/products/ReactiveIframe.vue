<template>
  <iframe
    v-if="props.src"
    ref="iframeRef"
    title="embeded subproduct"
    :src="props.src"
    class="iframe"
    :class="{ loading: isLoading }"
    @load="onLoad"
  ></iframe>
  <v-skeleton-loader v-else type="card" class="iframe"> </v-skeleton-loader>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'

function documentHead(): (
  | HTMLBaseElement
  | HTMLLinkElement
  | HTMLMetaElement
  | HTMLScriptElement
  | HTMLStyleElement
)[] {
  const children = []
  const metaCharsetElement = document.createElement('meta')
  metaCharsetElement.setAttribute('charset', 'UTF-8')
  children.push(metaCharsetElement)

  const metaViewportElement = document.createElement('meta')
  metaViewportElement.setAttribute('name', 'viewport')
  metaViewportElement.setAttribute(
    'content',
    'width=device-width,initial-scale=1',
  )
  children.push(metaViewportElement)

  const baseElement = document.createElement('base')
  baseElement.setAttribute('target', '_blank')
  children.push(baseElement)

  const scriptElement = document.createElement('script')
  scriptElement.src = iframeResizeObserverBlobUrl
  scriptElement.type = 'text/javascript'
  children.push(scriptElement)

  const styleElement = document.createElement('link')
  styleElement.rel = 'stylesheet'
  styleElement.href = styleBlobUrl
  styleElement.type = 'text/css'
  children.push(styleElement)

  return children
}

const getBlobURL = (code: string, type: 'text/javascript' | 'text/css') => {
  const blob = new Blob([code], { type })
  return URL.createObjectURL(blob)
}

const iframeResizeObserverBlobUrl = getBlobURL(
  `
  const observer = new ResizeObserver(([entry]) => { parent.postMessage({ height: entry.target.offsetHeight, width: entry.target.offsetWidth }, '*')
  });
  observer.observe(document.documentElement);
`,
  'text/javascript',
)

const styleBlobUrl = getBlobURL(
  `body { margin: 10px; overflow: hidden;}`,
  'text/css',
)


interface Props {
  src: string
}

const props = defineProps<Props>()

const iframeRef = useTemplateRef<HTMLIFrameElement>('iframeRef')
const isLoading = ref(true)

const debouncedOnLoad = useDebounceFn(() => {
  isLoading.value = false
}, 100)

const resizeMessage = (event: MessageEvent) => {
    console.log('Received message from iframe:', event.data)
  const iframeElement = iframeRef.value
  if (iframeElement !== null && event.data.height) {
    iframeElement.style.height = `${event.data.height}px`
  }
  if (iframeElement !== null && event.data.width) {
    iframeElement.style.width = `${event.data.width}px`
  }
  debouncedOnLoad()
}

onMounted(() => {
  addEventListener('message', resizeMessage)
})

onBeforeUnmount(() => {
  removeEventListener('message', resizeMessage)
})

function onLoad(event: Event) {
  const iframeElement = event.target as HTMLIFrameElement
  const contentDoc = iframeElement.contentDocument
  if (contentDoc) {
    for (const element of documentHead()) {
      contentDoc.head.appendChild(element)
    }
  }
}

watch(
  () => props.src,
  () => {
    isLoading.value = true
  },
)
</script>

<style scoped>
.iframe {
  height: 0px;
  width: 1060px;
  margin: 20px;
  border: none;
  box-sizing: border-box;
  background-color: white;
  box-shadow: 0 0.5mm 2mm rgba(0, 0, 0, 0.3);
  transition: opacity 100ms ease-in;
}

.loading {
  opacity: 0;
  transition: opacity 0s;
}
</style>
