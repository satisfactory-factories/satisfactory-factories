<template>
  <v-toolbar dark>
    <v-toolbar-title><v-icon icon="fas fa-industry-alt" /> Factory Planner</v-toolbar-title>
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
    </template>
  </v-toolbar>
</template>

<script lang="ts">
  export default {
    data () {
      return {
        tab: null,
        items: [
          { title: 'Planner', icon: 'fas fa-ruler-triangle', href: '/' },
          { title: 'Graph', icon: 'fas fa-project-diagram', href: '/graph' },
          { title: 'Recipes', icon: 'fas fa-hat-chef', href: '/recipes' },
          { title: 'Settings', icon: 'fas fa-wrench', href: '/settings' },
        ],
      }
    },
  }
</script>
