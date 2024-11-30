<template>
  <v-row class="mx-2 my-3 px-0" :class="classes">
    <v-col align-self="center" class="flex-grow-0 pa-0">
      <game-asset
        height="48"
        :subject="partId"
        type="item"
        width="48"
      />
    </v-col>
    <v-col class="py-0">
      <p v-if="part.satisfied">
        <v-icon icon="fas fa-check" />
        <span class="ml-2">
          <b>{{ getPartDisplayName(partId) }}</b><br>{{ formatNumber(part.amountSupplied) }}/{{ formatNumber(part.amountRequired) }}/min
        </span>
      </p>
      <p v-else>
        <v-icon icon="fas fa-times" />
        <span class="ml-2">
          <b>{{ getPartDisplayName(partId) }}</b><br>{{ formatNumber(part.amountSupplied) }}/{{ formatNumber(part.amountRequired) }} /min
        </span>
      </p>
    </v-col>
    <v-col align-self="center" class="text-right flex-shrink-0 py-0" cols="auto">
      <v-btn
        v-if="!getProduct(factory, partId) && !isItemRawResource(partId) && !part.satisfied"
        class="ml-2 my-1"
        color="primary"
        size="small"
        variant="outlined"
        @click="addProduct(factory, partId, part.amountRemaining)"
      >+&nbsp;<i class="fas fa-cube" /><span class="ml-1">Product</span>
      </v-btn>
      <v-btn
        v-if="getProduct(factory, partId) && !isItemRawResource(partId) && !part.satisfied"
        class="ml-2 my-1"
        color="green"
        size="small"
        @click="fixProduction(factory, partId)"
      ><i class="fas fa-wrench" /><span class="ml-1">Fix Production</span>
      </v-btn>
      <v-btn
        v-if="getImport(factory, partId) && !part.satisfied"
        class="ml-2 my-1"
        color="green"
        size="small"
        @click="fixSatisfactionImport(factory, partId)"
      >&nbsp;<i class="fas fa-arrow-up" /><span class="ml-1">Fix Import</span>
      </v-btn>
    </v-col>
  </v-row>

</template>

<script setup lang="ts">
  import { inject } from 'vue'
  import { getPartDisplayName } from '@/utils/helpers'
  import { formatNumber } from '@/utils/numberFormatter'
  import { Factory, FactoryInput, FactoryItem, PartMetrics } from '@/interfaces/planner/FactoryInterface'
  import { addProductToFactory } from '@/utils/factory-management/products'
  import { useGameDataStore } from '@/stores/game-data-store'

  const getProduct = inject('getProduct') as (factory: Factory, productId: string) => FactoryItem | undefined
  const isItemRawResource = inject('isItemRawResource') as (part: string) => boolean
  const updateFactory = inject('updateFactory') as (factory: Factory) => void
  const fixProduction = inject('fixProduction') as (factory: Factory, partIndex: string) => void

  const { getDefaultRecipeForPart } = useGameDataStore()

  const props = defineProps<{
    factory: Factory;
    classes: {'text-green': boolean, 'text-red': boolean},
    part: PartMetrics;
    partId: string;
  }>()

  const part = ref<PartMetrics>(props.part)
  const partId = ref<string>(props.partId)

  const addProduct = (factory: Factory, part: string, amount: number): void => {
    addProductToFactory(factory, {
      id: part,
      amount,
      recipe: getDefaultRecipeForPart(part),
    })

    updateFactory(factory)
  }

  const getImport = (factory: Factory, partIndex: string): FactoryInput | undefined => {
    // Search the inputs array for the outputPart using the part index
    return factory.inputs.find(input => input.outputPart === partIndex)
  }

  const fixSatisfactionImport = (factory: Factory, partIndex: string) => {
    const itemImport = getImport(factory, partIndex)

    // If the import is not found
    if (!itemImport) {
      console.error(`Could not find import for ${partIndex} to fix!`)
      return
    }

    // Set the import amount to the required amount
    itemImport.amount = factory.parts[partIndex].amountRequired
    updateFactory(factory)
  }
</script>
