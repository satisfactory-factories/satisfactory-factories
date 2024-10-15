<template>
  <v-row>
    <v-col>
      <v-card :id="factory.id" :style="factoryStyling(factory)">
        <v-row class="pa-4 pb-0 mb-0 border-b align-center" :style="factoryHeaderStyling(factory)">
          <v-col class="text-h4 flex-grow-1" cols="8">
            <i class="fas fa-industry" style="width: 35px" />
            <input
              v-model="factory.name"
              class="ml-3 factory-name"
              placeholder="Factory Name"
              @input="updateFactory(factory)"
            >
          </v-col>
          <v-col align-self="center" class="text-right" cols="4">
            <v-btn
              v-show="!factory.hidden"
              color="primary"
              prepend-icon="fas fa-eye-slash"
              variant="outlined"
              @click="factory.hidden = true"
            >Hide
            </v-btn>
            <v-btn
              v-show="factory.hidden"
              color="primary"
              prepend-icon="fas fa-eye"
              variant="outlined"
              @click="factory.hidden = false"
            >Show
            </v-btn>
            <v-btn
              class="ml-2"
              color="red"
              prepend-icon="fas fa-trash"
              variant="outlined"
              @click="confirmDelete() && deleteFactory(factory)"
            >Delete Factory
            </v-btn>
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
            :help-text="helpText"
          />
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
  import { defineProps } from 'vue'
  import { Factory } from '@/interfaces/planner/Factory'
  import { DataInterface } from '@/interfaces/DataInterface'

  const updateFactory = inject('updateFactory') as (factory: Factory) => void
  const deleteFactory = inject('deleteFactory') as (factory: Factory) => void

  defineProps<{
    factory: Factory
    gameData: DataInterface
    helpText: boolean
  }>()

  const factoryStyling = (factory: Factory) => {
    return {
      border: `1px solid ${factory.hasProblem ? '#dc3545' : 'rgb(108, 108, 108)'}`,
    }
  }

  const factoryHeaderStyling = (factory: Factory) => {
    const satisfied = factory.requirementsSatisfied

    return {
      backgroundColor: `${satisfied ? 'rgba(43, 43, 43, 0.4)' : 'rgba(140, 9, 21, 0.4)'}`,
    }
  }

  const confirmDelete = (message = 'Are you sure?') => {
    return confirm(message)
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
</style>
