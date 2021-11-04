<template>
  <v-app>
    <login-component />
    <v-main>
      <v-navigation-drawer class="navbar" permanent absolute>
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
      <router-view/>
    </v-main>
  </v-app>
</template>

<script lang="ts">
import LoginComponent from '@/components/LoginComponent.vue'
import { Component, Vue } from 'vue-property-decorator'

@Component({ components: { LoginComponent } })
export default class Home extends Vue {
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
