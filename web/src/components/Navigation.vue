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
          :key="item"
          :text="item"
          :value="item"
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
          'Factories', 'Visualizer', 'Statistics', 'Settings'
        ],
      }
    },
  }
</script>
