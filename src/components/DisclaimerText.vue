<template>
    <v-card class="rounded-xl">
        <v-card-title>USER TERMS AND CONDITIONS</v-card-title>
        <v-card-text class="scroll" v-html="disclaimerText"></v-card-text>
    </v-card>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component
export default class DisclaimerText extends Vue {
    disclaimerText: string = ''

    async created(): Promise<void> {
        this.disclaimerText = await this.getDisclaimerText()
    }

    async getDisclaimerText() {
        const disclaimerFilePath = `${process.env.VUE_APP_STATIC_URL}/disclaimer.htm`
        try {
            const response = await fetch(disclaimerFilePath)
            const data = await response.text()
            return data
        } catch (error) {
            console.error('Error fetching disclaimer text:', error)
            return ''
        }
    }
}
</script>

<style scoped>
.scroll {
  max-height: 80vh;
  overflow-y: scroll;
}
</style>