<template>
  <v-app>
    <navigation @click="closeAuthTray" />
    <auth ref="authRef" />
    <tab-navigation v-if="showTabNavigation" />
    <v-main @click="closeAuthTray">
      <router-view />
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
  import { useRoute } from 'vue-router'

  const route = useRoute()

  const showTabNavigation = computed(() => {
    return route.path === '/' || route.path === '/graph'
  })

  const authRef = ref(null)

  const closeAuthTray = () => {
    if (authRef.value) {
      // @ts-ignore
      authRef.value.closeTray()
    }
  }
</script>
