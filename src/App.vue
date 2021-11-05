<template>
  <v-app>
    <v-app-bar color="primary"
      dense
      app
      :clipped-left="!this.$vuetify.rtl"
      :clipped-right="this.$vuetify.rtl"
    >
      <v-app-bar-nav-icon @click="drawer = !drawer" />
      <img src="@/assets/images/deltares_logo.png" contain height="100%" />
      <v-toolbar-title>Delft-fews web OC</v-toolbar-title>
      <v-spacer />
      <login-component />
    </v-app-bar>
    <v-navigation-drawer
      v-model="drawer"
      class="navbar"
      app
      clipped
      hide-overlay
      :right="this.$vuetify.rtl"
      >
        <v-list>
          <v-list-item to="/">
            <v-list-item-content>
              Home
            </v-list-item-content>
          </v-list-item>
          <v-list-item to="/map">
            <v-list-item-content>
              Map
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-navigation-drawer>
    <v-main>
      <router-view/>
    </v-main>
  </v-app>
</template>

<script lang="ts">
import LoginComponent from '@/components/LoginComponent.vue'
import { Component, Vue } from 'vue-property-decorator'

@Component({ components: { LoginComponent } })
export default class Home extends Vue {
  drawer: boolean | null = null
}
</script>

<style lang="scss">
html {
  overflow-y: hidden;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

</style>
