<template>
  <div class="login-container">
    <div>
      <img src="@/assets/images/deltares_logo.png" alt="Deltares" contain style="max-width: 80%"/>
    </div>
    <h1 style="color: white;">Delft-FEWS Web Operator Client</h1>
    <div class="login-providers">
      <deltares-login name="Deltares"/>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import DeltaresLogin from '@/components/DeltaresLogin.vue'

@Component({
  components: {
    DeltaresLogin
  }
})
export default class Home extends Vue {}
</script>

<style scoped>
.login-container {
  background-image: url("/D111-103_getijdenland_small.jpg");
  height: 100%;
  overflow-y: auto;
}

.login-providers {
  margin: 50px;
}

</style>
