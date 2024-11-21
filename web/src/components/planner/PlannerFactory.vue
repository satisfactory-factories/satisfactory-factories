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
            <v-dialog v-if="isDebugMode" scrollable width="auto">
              <template #activator="{ props: activatorProps }">
                <v-btn
                  v-bind="activatorProps"
                  class="mr-2"
                  color="primary"
                  prepend-icon="fas fa-bug"
                  ripple
                  variant="flat"
                >
                  Show data
                </v-btn>
              </template>
              <template #default="{ isActive }">
                <v-card title="Factory debug info">
                  <v-card-text>
                    <pre>
                {{ factory }}
              </pre>
                  </v-card-text>
                  <v-card-actions class="sticky">
                    <v-btn
                      text="Close Dialog"
                      @click="isActive.value = false"
                    />
                  </v-card-actions>
                </v-card>
              </template>
            </v-dialog>
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
              class="mr-2"
              color="orange rounded"
              icon="fa fa-copy"
              size="small"
              variant="outlined"
              @click="copyFactory(factory)"
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
          <v-divider class="my-4 mx-n4" color="white" thickness="5px" />
          <planner-factory-imports
            :factory="factory"
            :help-text="helpText"
          />
          <v-divider class="my-4 mx-n4" color="white" thickness="5px" />
          <planner-factory-satisfaction
            :factory="factory"
            :help-text="helpText"
          />
          <v-divider class="my-4 mx-n4" color="white" thickness="5px" />
          <planner-factory-exports
            :factory="factory"
            :game-data="gameData"
            :help-text="helpText"
          />
        </v-card-text>
        <!-- Hidden factory collapse -->
        <v-card-text v-show="factory.hidden" class="pa-0">
          <v-row
            class="py-2 px-4 my-0 mx-0"
            :class="hasExports(factory) ? 'border-b-md' : ''"
          >
            <p v-if="factory.products.length === 0" class="text-body-1">Empty factory! Select a product!</p>
            <div v-else>
              <p class="text-body-1 d-inline-block mr-2">Producing: </p>
              <v-chip
                v-for="part in factory.products"
                :key="`${factory.id}-${part.id}`"
                class="sf-chip"
              >
                <span class="mr-2">
                  <game-asset
                    v-if="part.id"
                    :subject="part.id"
                    type="item"
                  />
                </span>
                <span>
                  <b>{{ getPartDisplayName(part.id) }}</b>: {{ formatNumber(part.amount) }}/min
                </span>
                <span
                  v-if="hasMetricsForPart(factory, part.id) && factory.dependencies.metrics[part.id].difference !== 0"
                  class="ml-2"
                  :class="differenceClass(factory.dependencies.metrics[part.id].difference)"
                >({{ formatNumber(factory.dependencies.metrics[part.id].difference) }}/min)</span>
              </v-chip>
            </div>
          </v-row>
          <div
            v-if="factory.dependencies?.requests && Object.keys(factory.dependencies?.requests).length > 0"
            class="text-body-1 py-2 px-4 pb-1"
          >
            <div class="d-flex align-center">
              <p class="mr-2">Exports:</p>
              <div
                v-for="dependant in Object.keys(factory.dependencies.requests)"
                :key="dependant"
                class="mr-2 pl-2 no-bottom rounded factory-link"
                @click="navigateToFactory(dependant)"
              >
                <i class="fas fa-industry" />
                <span class="ml-2">
                  <b>{{ findFactory(dependant).name }}:</b>
                </span>
                <v-chip
                  v-for="part in factory.dependencies.requests[dependant]"
                  :key="part.part"
                  class="sf-chip blue ml-2"
                >
                  <game-asset
                    v-if="part.part"
                    height="32"
                    :subject="part.part"
                    type="item"
                    width="32"
                  />
                  <span class="ml-2"><b>{{ getPartDisplayName(part.part) }}:</b> {{ formatNumber(part.amount) }}/min</span>
                </v-chip>
              </div>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
  <v-divider class="my-6 opacity-50" color="blue" thickness="5px" />
</template>

<script setup lang="ts">
  import { defineProps, inject } from 'vue'
  import { Factory } from '@/interfaces/planner/FactoryInterface'
  import { DataInterface } from '@/interfaces/DataInterface'
  import { getPartDisplayName } from '@/utils/helpers'
  import { formatNumber } from '@/utils/numberFormatter'
  import { useAppStore } from '@/stores/app-store'

  const findFactory = inject('findFactory') as (id: string | number) => Factory
  const updateFactory = inject('updateFactory') as (factory: Factory) => void
  const copyFactory = inject('copyFactory') as (factory: Factory) => void
  const deleteFactory = inject('deleteFactory') as (factory: Factory) => void
  const moveFactory = inject('moveFactory') as (factory: Factory, direction: string) => void
  const navigateToFactory = inject('navigateToFactory') as (id: string | number) => void
  const { isDebugMode } = useAppStore()

  defineProps<{
    factory: Factory
    gameData: DataInterface
    helpText: boolean
    totalFactories: number;
  }>()

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
    if (!factory.dependencies?.requests) return false
    return Object.keys(factory.dependencies.requests).length > 0
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
