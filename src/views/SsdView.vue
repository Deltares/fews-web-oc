<template>
  <div>
    <v-navigation-drawer
    v-model="drawer"
    app
    clipped
    hide-overlay
    :right="$vuetify.rtl"
    width="320"
    >
    </v-navigation-drawer>
    <v-main style="overflow-y: auto;">
      <SSDComponent src="https://rwsos-dataservices-ont.avi.deltares.nl/iwp/FewsWebServices/ssd?request=GetDisplay&ssd=Overzichtsscherm_WMCN"
    />
    </v-main>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import SSDComponent from '@/components/SsdComponent.vue'

@Component({
  components: {
    SSDComponent
  }
})
export default class SsdView extends Vue {
  drawer = true
}
</script>
