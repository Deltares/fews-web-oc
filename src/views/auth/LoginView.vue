<template>
  <v-app>
    <v-main class="login-container">
      <div>&nbsp;</div>
      <h1 style="color: white">{{ appName }}</h1>
      <div class="login-providers">
        <deltares-login :name="companyName" />
      </div>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import DeltaresLogin from './DeltaresLogin.vue'

import { configManager } from '@/services/application-config';

const appName = configManager.get('APPLICATION_NAME') ?? "Delft-FEWS Web Operator Client"
const companyName = configManager.get('COMPANY_NAME') ?? "Deltares"
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
