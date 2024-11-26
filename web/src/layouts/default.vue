<template>
  <v-app>
    <template v-if="!hasError">
      <navigation>
        <template #append>
          <auth />
        </template>
      </navigation>

      <tab-navigation v-if="showTabNavigation" />
    </template>

    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
  import { useRoute } from 'vue-router'

  // Disable auth and other elements if an error is present as they will likely error themselves.
  const hasError = localStorage.getItem('error') ?? null
  const route = useRoute()

  const showTabNavigation = computed(() => {
    return route.path === '/' || route.path === '/graph'
  })
</script>
