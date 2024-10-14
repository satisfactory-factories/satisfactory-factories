<template>
  <v-row>
    <v-col>
      <v-list v-if="factories.length > 0" density="compact">
        <v-list-item v-for="(factory) in factories" :key="factory.id">
          <v-card
            class="w-100"
            :style="factoryStyling(factory)"
            @click="navigateToFactory(factory.id)"
          >
            <v-card-title>
              <i class="fas fa-industry" />
              <span class="ml-2">{{ factory.name }}</span>
            </v-card-title>
          </v-card>
        </v-list-item>
      </v-list>
    </v-col>
  </v-row>
  <v-row class="pa-0 ma-0">
    <v-col class="text-center">
      <v-btn
        color="primary"
        prepend-icon="fas fa-plus"
        ripple
        @click="createFactory"
      >
        Add Factory
      </v-btn>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
  import { defineEmits, defineProps } from 'vue'
  import { Factory } from '@/interfaces/planner/Factory'

  defineProps<{ factories: Factory[] }>()
  const emit = defineEmits<{ 'createFactory':() => void }>()

  const factoryStyling = (factory: Factory) => {
    return {
      border: `1px solid ${factory.hasProblem ? '#dc3545' : 'rgb(108, 108, 108)'}`,
      backgroundColor: `${factory.hasProblem ? 'rgba(140, 9, 21, 0.4)' : 'rgba(43, 43, 43, 0.4)'}`,
    }
  }

  const navigateToFactory = (factoryId: string) => {
    const factoryElement = document.getElementById(`${factoryId}`)
    if (factoryElement) {
      factoryElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const createFactory = () => {
    emit('createFactory')
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
