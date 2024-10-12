<template>
  <v-row>
    <v-col>
      <div class="mb-2">
        <v-btn
          color="green"
          prepend-icon="fas fa-clipboard-list"
          variant="tonal"
          ripple @click="confirmDelete('Are you sure? This will replace your factories with the demo example!') && $emit('show-demo')">
            Show Demo
        </v-btn>
      </div>
      <div class="mb-2">
        <v-btn
          color="blue"
          class="mr-2"
          prepend-icon="fas fa-compress-arrows-alt"
          variant="tonal"
          @click="$emit('hide-all')">
            Hide all
        </v-btn>
        <v-btn
          color="blue"
          prepend-icon="fas fa-expand-arrows-alt"
          variant="tonal"
          @click="$emit('show-all')">
            Expand all
        </v-btn>
      </div>
      <div class="mb-2">
        <v-btn
          color="red"
          prepend-icon="fas fa-trash"
          variant="tonal"
          @click="confirmDelete('Are you really sure? This will delete literally everything!') && $emit('clear-all')">
            Clear
        </v-btn>
      </div>
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
