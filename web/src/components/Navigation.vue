<template>
  <v-toolbar dark>
    <v-toolbar-title>
      <v-icon icon="fas fa-industry-alt" />
      <span class="ml-3">Satisfactory Factories</span>
    </v-toolbar-title>
    <template #extension>
      <v-tabs
        v-model="tab"
      >
        <v-tab
          v-for="item in items"
          :key="item"
          :prepend-icon="item.icon"
          :text="item.title"
          :to="item.href"
          :value="item.href"
        />
      </v-tabs>
      <ko-fi />

    </template>
  </v-toolbar>
</template>

<script lang="ts">
  import KoFi from '@/components/ko-fi.vue'

  export default {
    components: { KoFi },
    data () {
      return {
        tab: null,
        items: [
          { title: 'Planner', icon: 'fas fa-ruler-triangle', href: '/' },
          { title: 'Graph', icon: 'fas fa-project-diagram', href: '/graph' },
          { title: 'Recipes', icon: 'fas fa-hat-chef', href: '/recipes' },
        ],
      }
    },
  }
</script>
