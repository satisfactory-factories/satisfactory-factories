<template>
  <v-toolbar dark>
    <v-toolbar-title><v-icon icon="fas fa-industry-alt"></v-icon> Factory Planner</v-toolbar-title>
    <template v-slot:extension>
      <v-tabs
        v-model="tab"
        align-tabs="title"
      >
        <v-tab
          v-for="item in items"
          :to="item.href"
          :key="item"
          :prepend-icon="item.icon"
          :text="item.title"
          :value="item.href"
        ></v-tab>
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
          { title: 'Planner', icon: 'fas fa-ruler-triangle', href: "/" },
          { title: 'Graph', icon: 'fas fa-project-diagram', href: "/graph" },
          { title: 'Recipes', icon: 'fas fa-hat-chef', href: "/recipes" },
          { title: 'Settings', icon: 'fas fa-wrench', href: "/settings" },
        ],
      }
    },
  }
</script>
