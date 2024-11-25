<template>
  <v-app>
    <v-main>
      <component :is="layout">
        <router-view />
      </component>
    </v-main>
  </v-app>
</template>

<script lang="ts" setup>
  import { ref, watch } from 'vue'
  import { useRoute } from 'vue-router'

  // Reactive layout variable
  const route = useRoute()
  const layout = ref(null)

  // Watch the route and dynamically load the corresponding layout
  watch(
    () => route.meta.layout,
    async (layoutName = 'default') => {
      try {
        console.log(`Loading layout ${layoutName.vue}`)
        const layoutModule = await import(`@/layouts/${layoutName}.vue`)
        layout.value = layoutModule.default
      } catch (error) {
        console.error(`Failed to load layout: ${layoutName}`, error)
        // Fallback to a default layout in case of errors
        const defaultLayout = await import('@/layouts/default.vue')
        layout.value = defaultLayout.default
      }
    },
    { immediate: true }
  )
</script>
