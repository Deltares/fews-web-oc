<template>
    <div id="legend" :class="isVisible ? 'invisible' : ''">
        <svg id="colourbar" width="600" height="100" style="fill:none;"></svg>
    </div>
</template>


<script setup lang="ts">
import {onMounted, ref, watch} from "vue";
import * as d3 from 'd3'
import * as webOcCharts from '@deltares/fews-web-oc-charts'
import {useDisplay} from "vuetify";

interface Props {
    value?: webOcCharts.ColourMap
}

const props = withDefaults(defineProps<Props>(), {
    value: undefined
})

const {mobile} = useDisplay()
let isVisible = ref<boolean>(true)
let group: any = undefined

watch(() => props.value, () => {
    updateColourBar()
})

watch(mobile, () => {
        updateColourBar()
    },
    {
        immediate: true,
    }
);


onMounted(() => {
    const svg = d3.select("#colourbar")
    group = svg.append('g').attr('transform', 'translate(50, 50)')
    updateColourBar()
})


function updateColourBar() {
    if (!props.value) return
    if (group == undefined) return

    // Remove possible previous colour map.
    group.selectAll("*").remove()
    // Create new colour bar and make it visible.
    const options: webOcCharts.ColourBarOptions = {
        type: 'nonlinear',
        useGradients: true,
        position: webOcCharts.AxisPosition.Bottom
    }
    new webOcCharts.ColourBar(
        group as any,
        props.value,
        mobile ? 250 : 400, 30,
        options)
    isVisible.value = true
}
</script>

<style scoped>
#legend .invisible {
    display: none
}
</style>