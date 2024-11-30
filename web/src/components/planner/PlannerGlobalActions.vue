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
        prepend-icon="fas fa-users-class"
        ripple
        variant="tonal"
        @click="emit('show-intro')"
      >
        Show Intro
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
      <templates />

      <div v-if="isDebugMode">
        <v-btn
          v-if="isDebugMode"
          class="ma-1 mb-0"
          color="secondary"
          prepend-icon="fas fa-bug"
          variant="tonal"
          @click="copyPlanToClipboard"
        >
          Copy plan
        </v-btn>
        <v-btn
          v-if="isDebugMode"
          class="ma-1"
          color="secondary"
          prepend-icon="fas fa-bug"
          variant="tonal"
          @click="pastePlanFromClipboard"
        >
          Paste plan
        </v-btn>
      </div>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
  import { defineEmits, defineProps } from 'vue'
  import { useAppStore } from '@/stores/app-store'

  const { isDebugMode, getFactories, setFactories } = useAppStore()

  defineProps<{ helpTextShown: boolean }>()
  // eslint-disable-next-line func-call-spacing
  const emit = defineEmits<{
    (event: 'show-intro'): void;
    (event: 'hide-all'): void;
    (event: 'show-all'): void;
    (event: 'toggle-help-text'): void;
    (event: 'clear-all'): void;
  }>()

  const confirmDelete = (message: string): boolean => {
    return confirm(message)
  }

  const copyPlanToClipboard = () => {
    const plan = JSON.stringify(getFactories())
    navigator.clipboard.writeText(plan)
  }

  const pastePlanFromClipboard = () => {
    navigator.clipboard.readText().then(plan => {
      try {
        const parsedPlan = JSON.parse(plan)
        emit('clear-all')
        setFactories(parsedPlan)
      } catch (e) {
        alert('Invalid plan')
      }
    })
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
