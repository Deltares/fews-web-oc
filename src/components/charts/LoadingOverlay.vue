<template>
  <div class="loading-overlay">
    <v-icon size="x-large">mdi-loading mdi-spin</v-icon>
  </div>
</template>

<style scoped>
.loading-overlay {
  position: absolute;
  z-index: 1;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
