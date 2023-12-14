<template>
  <v-app>
    <v-main class="login-container">
      <div>&nbsp;</div>
      <h1 style="color: white">Delft-FEWS Web Operator Client</h1>
      <div class="login-providers">
        <deltares-login name="Deltares" />
      </div>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import DeltaresLogin from './DeltaresLogin.vue'
</script>

<style scoped>
.login-container {
  background-image: url('/images/D111-103_getijdenland_small.jpg');
  background-position-x: center;
  background-size: cover;
  text-align: center;
  height: 100%;
  overflow-y: auto;
}

.login-providers {
  margin: 50px;
}
</style>
