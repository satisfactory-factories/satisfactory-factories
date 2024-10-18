<template>
  <v-app>
    <navigation style="height: 112px" @click="closeAuthTray" />
    <auth ref="authRef" />
    <v-main @click="closeAuthTray">
      <router-view />
    </v-main>
    <!--    <app-footer />-->
  </v-app>
</template>

<script setup lang="ts">
  const authRef = ref(null)

  const closeAuthTray = () => {
    if (authRef.value) {
      authRef.value.closeTray()
    }
  }
</script>
