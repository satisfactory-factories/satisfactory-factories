<template>
  <div class="text-center mb-2 border-b">
    <div class="text-h5 text-center">
      <p>
        <i class="fas fa-calculator" />
        <span class="ml-2">Export calculations to</span>
      </p>
      <p class="text-h6">
        <i class="fas fa-industry" /><span class="ml-2">{{ destFactory.name }}</span>
      </p>
    </div>
    <p class="text-body-1 mb-2">{{ request.amount }}/min</p>
  </div>
  <div class="text-center border-b py-2">
    <v-chip
      v-for="belt in ['mk-1', 'mk-2', 'mk-3', 'mk-4', 'mk-5', 'mk-6']"
      :key="belt"
      class="mr-1 mb-1"
    >
      <game-asset :subject="`conveyor-belt-${belt}`" type="building" />
      <span class="ml-2"><b>{{ beltDisplay(belt) }}:</b> {{ calculateBelts(factory, request.amount, belt) }}x</span>
    </v-chip>
  </div>
  <div class="mt-4">
    <p v-if="helpText" class="text-body-2 text-center">
      <i class="fas fa-info-circle" />
      <span class="ml-1">
        It is assumed you are feeding the freight platforms with sufficient belt capacity. <br>Time is from "choo" to "choo".
      </span>
    </p>
    <div class="d-flex justify-center align-center text-center my-2">
      <v-text-field
        v-model.number="calculatorSettings.trainTime"
        density="compact"
        hide-details
        label="Round trip time (s)"
        max-width="225px"
        prepend-icon="fas fa-clock"
        variant="outlined"
      />
      <v-chip class="ml-2">
        <game-asset subject="freight-car" type="item" />
        <span class="ml-2">Freight Cars: {{ calculateTrainCars() }}</span>
      </v-chip>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { defineProps } from 'vue'
  import {
    ExportCalculatorSettings,
    Factory,
    FactoryDependencyMetrics,
    FactoryItem,
  } from '@/interfaces/planner/FactoryInterface'
  import { DataInterface } from '@/interfaces/DataInterface'

  const props = defineProps<{
    factory: Factory;
    destFactory: Factory;
    request: FactoryDependencyMetrics;
    product: FactoryItem;
    calculatorSettings: ExportCalculatorSettings
    gameData: DataInterface;
    helpText: boolean;
  }>()

  const calculateBelts = (factory: Factory, amount: string, beltType: string) => {
    // Simple math here to divide the amount by the belt's capacity

    let beltThroughput

    switch (beltType) {
      case 'mk-1':
        beltThroughput = 60
        break
      case 'mk-2':
        beltThroughput = 120
        break
      case 'mk-3':
        beltThroughput = 270
        break
      case 'mk-4':
        beltThroughput = 480
        break
      case 'mk-5':
        beltThroughput = 780
        break
      case 'mk-6':
        beltThroughput = 1200
        break
      default:
        beltThroughput = -1
        break
    }

    return (amount / beltThroughput).toFixed(1)
  }

  const beltDisplay = (belt: string) => {
    // Remove the dash and capitalize the first letter
    return belt.replace('-', '').replace(/\b\w/g, l => l.toUpperCase())
  }

  const calculateTrainCars = () => {
    const factory = props.factory
    const part = props.product.id
    const rTT = props.calculatorSettings.trainTime ?? 123

    // 1. Get the product info from game data
    const data = props.gameData.items.parts[part]

    if (!data.stackSize) {
      console.error(`Unable to get stack size for ${part}`)
    }

    // 2. Get the surplus of the product
    const surplus = factory.surplus[part].amount

    const freightCarCapacity = 32 * data.stackSize

    // 3. Calculate the number of freight cars needed
    const result = Math.ceil(surplus / freightCarCapacity)
    console.log('carsResult', result)
    return result
  }

</script>
