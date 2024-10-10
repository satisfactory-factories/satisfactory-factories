<template>
  <v-toolbar dark>
    <v-toolbar-title>Factory Planner</v-toolbar-title>
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
          { title: 'Planner', icon: 'fas fas-home', href: "/" },
          { title: 'Graph', icon: 'mdi-calendar', href: "/graph" },
          { title: 'Recipes', icon: 'mdi-book-open', href: "/recipes" },
          { title: 'Settings', icon: 'mdi-book-open', href: "/settings" },
        ],
      }
    },
  }
</script>
