<template>
  <v-toolbar dark>
    <div class="d-flex align-center ml-2 font-weight-bold text-h6">
      <img alt="Site logo" src="/SF.png" style="max-width: 48px;">
      <span class="ml-3">Satisfactory Factories</span>
      <span class="ml-2">
        <v-chip class="sf-chip blue small">ALPHA</v-chip>
      </span>
    </div>
    <v-tabs
      v-model="tab"
    >
      <v-tab
        v-for="item in items"
        :key="item.title"
        :prepend-icon="item.icon"
        :text="item.title"
        :to="item.href"
        :value="item.href"
      />
    </v-tabs>
    <ko-fi />
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
          { title: 'Graph (WIP)', icon: 'fas fa-project-diagram', href: '/graph' },
          { title: 'Recipes', icon: 'fas fa-hat-chef', href: '/recipes' },
        ],
      }
    },
  }
</script>
