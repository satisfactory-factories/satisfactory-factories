<template>
  <v-row>
    <v-col>
      <v-btn
        color="primary"
        prepend-icon="fas fa-plus"
        ripple @click="
        $emit('create-group')">
          Add Factory
      </v-btn>
      <v-btn
        color="green"
        prepend-icon="fas fa-clipboard-list"
        ripple @click="confirmDelete('Are you sure? This will replace your factories with the demo example!') && $emit('show-demo')">
          Show Demo
      </v-btn>
      <v-btn
        color="red"
        prepend-icon="fas fa-trash"
        @click="confirmDelete('Are you really sure? This will delete literally everything!') && $emit('clear-all')">
          Clear
      </v-btn>
    </v-col>
  </v-row>
</template>

<script lang="ts">
export default defineComponent({
  name: "PlannerGlobalActions",
  methods: {
    confirmDelete(message: string): boolean {
      return confirm(message);
    },
  },
});
</script>
