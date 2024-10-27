<template>
  <v-row>
    <v-col class="last-child-no-margin">
      <v-btn
        class="ma-1"
        color="blue"
        prepend-icon="fas fa-compress-alt"
        variant="tonal"
        @click="emit('hide-all')"
      >
        Hide all
      </v-btn>
      <v-btn
        class="ma-1"
        color="blue"
        prepend-icon="fas fa-expand-alt"
        variant="tonal"
        @click="emit('show-all')"
      >
        Expand all
      </v-btn>
      <v-btn
        class="ma-1"
        color="blue"
        prepend-icon="fas fa-info-circle"
        variant="tonal"
        @click="emit('toggle-help-text')"
      >
        {{ helpTextShown ? "Hide" : "Show" }} Info
      </v-btn>
      <v-btn
        class="ma-1"
        color="green"
        prepend-icon="fas fa-clipboard-list"
        ripple
        variant="tonal"
        @click="confirmDelete('Are you sure? This will replace your factories with the demo example!') && emit('show-demo')"
      >
        Show Demo
      </v-btn>
      <v-btn
        class="ma-1"
        color="red"
        prepend-icon="fas fa-trash"
        variant="tonal"
        @click="confirmDelete('Are you really sure? This will delete literally everything!') && emit('clear-all')"
      >
        Clear
      </v-btn>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
  import { defineEmits, defineProps } from 'vue'

  defineProps<{ helpTextShown: boolean }>()
  // eslint-disable-next-line func-call-spacing
  const emit = defineEmits<{
    (event: 'show-demo'): void;
    (event: 'hide-all'): void;
    (event: 'show-all'): void;
    (event: 'toggle-help-text'): void;
    (event: 'clear-all'): void;
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
