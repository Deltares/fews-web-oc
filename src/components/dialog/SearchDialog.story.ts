import { defineComponent, h, provide, ref } from 'vue'
import {
  createMemoryHistory,
  createRouter,
  routeLocationKey,
  routerKey,
} from 'vue-router'
import { useSearchContext } from '@/stores/searchContext'
import SearchDialog from './SearchDialog.vue'

export const ManyLocations = defineComponent({
  setup() {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [],
    })
    provide(routerKey, router)
    provide(routeLocationKey, router.currentRoute.value)

    const searchContext = useSearchContext()
    searchContext.search = ''
    searchContext.setTopologyNodes([], undefined)
    searchContext.setLocations(
      Array.from({ length: 20_000 }, (_, index) => ({
        locationId: `station-${index}`,
        locationName: `Station ${index}`,
      })),
    )
    const open = ref(true)

    return () =>
      h(SearchDialog, {
        modelValue: open.value,
        'onUpdate:modelValue': (value: boolean) => (open.value = value),
      })
  },
})
