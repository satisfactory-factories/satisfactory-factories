<template>
  <v-row>
    <v-col class="last-child-no-margin">
      <div class="mb-2">
        <v-btn
          color="green"
          prepend-icon="fas fa-clipboard-list"
          ripple
          variant="tonal"
          @click="confirmDelete('Are you sure? This will replace your factories with the demo example!') && emit('show-demo')"
        >
          Show Demo
        </v-btn>
      </div>
      <div class="mb-2">
        <v-btn
          class="mr-2"
          color="blue"
          prepend-icon="fas fa-compress-arrows-alt"
          variant="tonal"
          @click="emit('hide-all')"
        >
          Hide all
        </v-btn>
        <v-btn
          color="blue"
          prepend-icon="fas fa-expand-arrows-alt"
          variant="tonal"
          @click="emit('show-all')"
        >
          Expand all
        </v-btn>
      </div>
      <div class="mb-2">
        <v-btn
          color="blue"
          prepend-icon="fas fa-info-circle"
          variant="tonal"
          @click="emit('toggle-help-text')"
        >
          {{ helpTextShown ? "Hide" : "Show" }} Info Text
        </v-btn>
      </div>
      <div class="mb-2">
        <v-btn
          color="red"
          prepend-icon="fas fa-trash"
          variant="tonal"
          @click="confirmDelete('Are you really sure? This will delete literally everything!') && emit('clear-all')"
        >
          Clear
        </v-btn>
      </div>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
  import { defineEmits, defineProps } from 'vue'

  defineProps<{ helpTextShown: boolean }>()
  const emit = defineEmits<{
    'show-demo':() => void;
    'hide-all': () => void;
    'show-all': () => void;
    'toggle-help-text': () => void;
    'clear-all': () => void;
  }>()

  const confirmDelete = (message: string): boolean => {
    return confirm(message)
  }
</script>

<style lang="scss" scoped>
v-list-item {
  margin-bottom: 10px;
  :last-child {
    margin-bottom: 0;
  }
}
</style>
