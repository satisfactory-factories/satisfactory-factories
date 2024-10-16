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
              <v-row>
                <v-col align-self="center" class="text-body-1 pr-2">
                  <i class="fas fa-industry" />
                  <span class="ml-2">{{ truncateFactoryName(factory.name) }}</span>
                </v-col>
                <v-col align-self="end" class="text-right pl-0">
                  <v-btn
                    class="mr-1 rounded"
                    color="primary"
                    :disabled="factory.displayOrder === 0"
                    icon="fas fa-arrow-up"
                    size="x-small"
                    variant="outlined"
                    @click="moveFactory(factory, 'up')"
                  />
                  <v-btn
                    class="rounded"
                    color="primary"
                    :disabled="factory.displayOrder === totalFactories - 1"
                    icon="fas fa-arrow-down"
                    size="x-small"
                    variant="outlined"
                    @click="moveFactory(factory, 'down')"
                  /></v-col>
              </v-row>

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
  import { Factory } from '@/interfaces/planner/FactoryInterface'

  const navigateToFactory = inject('navigateToFactory') as (id: number) => void
  const moveFactory = inject('moveFactory') as (id: number) => void

  defineProps<{ factories: Factory[], totalFactories: number }>()
  const emit = defineEmits<{ 'createFactory':() => void }>()

  const factoryStyling = (factory: Factory) => {
    return {
      border: `1px solid ${factory.hasProblem ? '#dc3545' : 'rgb(108, 108, 108)'}`,
      backgroundColor: `${factory.hasProblem ? 'rgba(140, 9, 21, 0.4)' : 'rgba(43, 43, 43, 0.4)'}`,
    }
  }

  const createFactory = () => {
    emit('createFactory')
  }

  const truncateFactoryName = (name: string, limit: number = 24) => {
    return name.length > limit ? name.substring(0, limit) + '...' : name
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
