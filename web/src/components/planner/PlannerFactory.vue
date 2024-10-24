<template>
  <v-row>
    <v-col>
      <v-card :id="factory.id" :class="factoryClass(factory)">
        <v-row class="header">
          <v-col class="text-h4 flex-grow-1" cols="8">
            <i class="fas fa-industry" style="width: 35px" />
            <input
              v-model="factory.name"
              class="ml-3 factory-name"
              placeholder="Factory Name"
              @input="updateFactory(factory)"
            >
          </v-col>
          <v-col class="text-right" cols="4">
            <v-btn
              class="mr-2 rounded"
              color="primary"
              :disabled="factory.displayOrder === 0"
              icon="fas fa-arrow-up"
              size="small"
              variant="outlined"
              @click="moveFactory(factory, 'up')"
            />
            <v-btn
              class="mr-2 rounded"
              color="primary"
              :disabled="factory.displayOrder === totalFactories - 1"
              icon="fas fa-arrow-down"
              size="small"
              variant="outlined"
              @click="moveFactory(factory, 'down')"
            />
            <v-btn
              v-show="!factory.hidden"
              class="mr-2 rounded"
              color="secondary"
              icon="fas fa-compress-alt"
              size="small"
              variant="outlined"
              @click="factory.hidden = true"
            />
            <v-btn
              v-show="factory.hidden"
              class="mr-2 rounded"
              color="secondary"
              icon="fas fa-expand-alt"
              size="small"
              variant="outlined"
              @click="factory.hidden = false"
            />
            <v-btn
              color="red rounded"
              icon="fas fa-trash"
              size="small"
              variant="outlined"
              @click="confirmDelete() && deleteFactory(factory)"
            />
          </v-col>
        </v-row>
        <v-card-text v-show="!factory.hidden">
          <planner-factory-products
            :factory="factory"
            :game-data="gameData"
            :help-text="helpText"
          />
          <v-divider class="my-4 mx-n4" color="white" thickness="2px" />
          <planner-factory-imports
            :factory="factory"
            :help-text="helpText"
          />
          <v-divider class="my-4 mx-n4" color="white" thickness="2px" />
          <planner-factory-satisfaction
            :factory="factory"
            :help-text="helpText"
          />
          <v-divider class="my-4 mx-n4" color="white" thickness="2px" />
          <planner-factory-exports
            :factory="factory"
            :game-data="gameData"
            :help-text="helpText"
          />
          <v-divider class="my-4 mx-n4" color="white" thickness="2px" />
          <v-btn color="primary" @click="showDebug = !showDebug">
            <i class="fas fa-bug" />
            <span class="ml-2">Show Debug Data</span>
          </v-btn>
          <div v-show="showDebug">
            <pre>{{ factory }}</pre>
          </div>
        </v-card-text>
        <v-card-text v-show="factory.hidden" class="pa-0">
          <v-row
            class="pa-4 px-4 my-2 mx-0"
            :class="hasExports(factory) ? 'border-b-md' : ''"
          >
            <p v-if="factory.products.length === 0" class="text-body-1">Empty factory! Select a product!</p>
            <div v-else>
              <p class="text-body-1 d-inline-block mr-2">Producing: </p>
              <v-chip
                v-for="part in factory.products"
                :key="part.id"
                class="mr-2 border-md py-4"
              >
                <game-asset
                  class="mr-2"
                  :subject="part.id"
                  type="item"
                />
                <b>{{ getPartDisplayName(part.id) }}</b>: {{ part.amount }}/min
                <span
                  v-if="hasMetricsForPart(factory, part.id)"
                  class="ml-2"
                  :class="differenceClass(factory.dependencies.metrics[part.id].difference)"
                >({{ factory.dependencies.metrics[part.id].difference }}/min)</span>
              </v-chip>
            </div>
          </v-row>
          <div
            v-if="factory.dependencies?.requests && Object.keys(factory.dependencies?.requests).length > 0"
            class="text-body-1 pa-2 px-4 mt-2 pb-1"
          >
            <p>Exporting to:</p>
            <div class="d-flex">
              <div
                v-for="dependant in Object.keys(factory.dependencies.requests)"
                :key="dependant"
                class="mr-2 no-bottom pa-2 rounded factory-link"
                @click="navigateToFactory(dependant)"
              >
                <i class="fas fa-industry" />
                <span class="ml-2">
                  <b>{{ findFactory(dependant).name }}:</b>
                </span>
                <v-chip
                  v-for="part in factory.dependencies.requests[dependant]"
                  :key="part.part"
                  class="mx-1 border-md py-4"
                >
                  <game-asset height="32" :subject="part.part" type="item" width="32" />
                  <span class="ml-2"><b>{{ getPartDisplayName(part.part) }}:</b> {{ part.amount }}/min</span>
                </v-chip>
              </div>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
  import { defineProps, inject } from 'vue'
  import { Factory } from '@/interfaces/planner/FactoryInterface'
  import { DataInterface } from '@/interfaces/DataInterface'

  const findFactory = inject('findFactory') as (id: number) => Factory
  const updateFactory = inject('updateFactory') as (factory: Factory) => void
  const deleteFactory = inject('deleteFactory') as (factory: Factory) => void
  const moveFactory = inject('moveFactory') as (factory: Factory, direction: string) => void
  const navigateToFactory = inject('navigateToFactory') as (id: number) => void
  const getPartDisplayName = inject('getPartDisplayName') as (part: string) => string

  defineProps<{
    factory: Factory
    gameData: DataInterface
    helpText: boolean
    totalFactories: number;
  }>()

  const showDebug = ref(false)

  const factoryClass = (factory: Factory) => {
    return {
      'factory-card': true,
      problem: factory.hasProblem,
    }
  }

  const confirmDelete = (message = 'Are you sure you want to delete this factory?') => {
    return confirm(message)
  }

  const differenceClass = (difference: number) => {
    return {
      'text-green': difference > 0,
      'text-red': difference < 0,
    }
  }

  const hasMetricsForPart = (factory: Factory, part: string) => {
    return factory.dependencies.metrics && factory.dependencies.metrics[part]
  }

  const hasExports = (factory: Factory) => {
    return Object.keys(factory.dependencies.requests).length > 0 ?? false
  }
</script>

<style lang="scss" scoped>
.factory-name {
  width: 85%;
  padding: 6px;
  border-radius: 4px;
  transition: background-color 0.3s;

  &:hover {
    cursor: pointer;
    background-color: #323232;
  }
}

.factory-link {
  &:hover {
    cursor: pointer;
    background-color: #323232;
  }
}
</style>
