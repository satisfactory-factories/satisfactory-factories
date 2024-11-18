<template>
  <v-app>
    <navigation @click="closeAuthTray" />
    <auth ref="authRef" />
    <v-main @click="closeAuthTray">
      <router-view />
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
  const authRef = ref(null)

  const closeAuthTray = () => {
    if (authRef.value) {
      // @ts-ignore
      authRef.value.closeTray()
    }
  }
</script>
