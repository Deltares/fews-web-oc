<template>
  <div style="height: 100%; overflow-y: auto;">
    <div>
      <v-tabs v-model="selectedTab">
        <v-tab>Running tasks</v-tab>
        <v-tab>Import status</v-tab>
        <v-tab-item :key="0">
          <RunningTasks :base-url="this.baseUrl" :visible="this.selectedTab===0"></RunningTasks>
        </v-tab-item>
        <v-tab-item :key="1">
          <ImportStatusComponent :base-url="this.baseUrl" :visible="this.selectedTab===1"></ImportStatusComponent>
        </v-tab-item>
      </v-tabs>
    </div>
  </div>
</template>

<script lang="ts">
import {Component, Vue} from 'vue-property-decorator'
import RunningTasks from "@/components/systemmonitor/RunningTasks.vue";
import ImportStatusComponent from "@/components/systemmonitor/ImportStatusComponent.vue";

@Component({
  components: {ImportStatusComponent, RunningTasks}
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
