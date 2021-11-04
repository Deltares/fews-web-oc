<template>
  <date-time-slider />
</template>

<script lang="ts">
import { DateTimeSlider } from 'fews-web-oc-components'
import { Component, Vue } from 'vue-property-decorator'

@Component
export default class TimeSlider extends Vue {
  components: {
    DateTimeSlider
  }
})

</script>
