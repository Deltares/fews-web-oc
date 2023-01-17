<template>
  <div style="height: 100%; overflow-y: auto;">
    <div>
      <v-tabs v-model="selectedTab">
        <v-tab :key="0">Running tasks</v-tab>
        <v-tab :key="1">Import status</v-tab>
        <v-tab :key="2">Forecasts</v-tab>
      </v-tabs>
      <v-tabs-items v-model="selectedTab">
        <v-tab-item >
          <RunningTasks :base-url="this.baseUrl" :time-out="20000"></RunningTasks>
        </v-tab-item>
        <v-tab-item :key="1">
          <ImportStatusComponent :base-url="this.baseUrl" :time-out="20000"></ImportStatusComponent>
        </v-tab-item>
        <v-tab-item :key="2">
          <Forecasts :base-url="this.baseUrl"></Forecasts>
        </v-tab-item>
      </v-tabs-items>
    </div>
  </div>
</template>

<script lang="ts">
import {Component, Vue} from 'vue-property-decorator'
import RunningTasks from "@/components/systemmonitor/RunningTasks.vue";
import ImportStatusComponent from "@/components/systemmonitor/ImportStatusComponent.vue";
import Forecasts from "@/components/systemmonitor/Forecasts.vue";

@Component({
  components: {ImportStatusComponent, RunningTasks, Forecasts}
})
export default class DisplayComponent extends Vue {
  baseUrl: string = "";
  selectedTab: number = 0;

  mounted() {
    this.baseUrl = this.$config.get('VUE_APP_FEWS_WEBSERVICES_URL')
  }

}
</script>

<style scoped>
</style>
