<template>
  <v-row class="mx-0 my-2 px-2 pl-4" :class="classes" style="height: 68px">
    <v-col class="flex-grow-0 pa-0 align-content-center">
      <game-asset
        height="48"
        :subject="partId"
        type="item"
        width="48"
      />
    </v-col>
    <v-col class="py-0 align-content-center">
      <p v-if="reactivePart.satisfied">
        <v-icon icon="fas fa-check" />
        <span class="ml-2">
          <b>{{ getPartDisplayName(partId) }}</b><br>{{ formatNumber(reactivePart.amountSupplied) }}/{{ formatNumber(reactivePart.amountRequired) }} /min
        </span>
      </p>
      <p v-else>
        <v-icon icon="fas fa-times" />
        <span class="ml-2">
          <b>{{ getPartDisplayName(partId) }}</b><br>{{ formatNumber(reactivePart.amountSupplied) }}/{{ formatNumber(reactivePart.amountRequired) }} /min
        </span>
      </p>
    </v-col>
    <v-col align-self="center" class="text-right align-content-center flex-shrink-0 py-0" cols="auto">
      <v-btn
        v-if="!getProduct(factory, partId) && !isItemRawResource(partId) && !reactivePart.satisfied"
        class="my-1 d-block"
        color="primary"
        size="small"
        variant="outlined"
        @click="addProduct(factory, partId, reactivePart.amountRemaining)"
      >+&nbsp;<i class="fas fa-cube" /><span class="ml-1">Product</span>
      </v-btn>
      <v-btn
        v-if="getProduct(factory, partId) && !isItemRawResource(partId) && !reactivePart.satisfied"
        class="my-1 d-block"
        color="green"
        size="small"
        @click="fixProduction(factory, partId)"
      ><i class="fas fa-wrench" /><span class="ml-1">Fix Production</span>
      </v-btn>
      <v-btn
        v-if="getImport(factory, partId) && !reactivePart.satisfied"
        class="my-1 d-block"
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
    part: PartMetrics;
    partId: string;
  }>()

  const reactivePart = reactive(props.part)
  const partId = ref<string>(props.partId)

  // This is required to make it reactive, as the part object is an array and thus not reactive.
  // Yes it's a hack, no I don't care. I'm sick of this now.
  watch(() => props.part, newPart => {
    reactivePart.amountRequired = newPart.amountRequired
    reactivePart.amountSupplied = newPart.amountSupplied
    reactivePart.amountRemaining = newPart.amountRemaining
    reactivePart.satisfied = newPart.satisfied
  })

  const classes = computed(() => {
    return {
      'text-green': reactivePart.satisfied,
      'text-red': !reactivePart.satisfied,
    }
  })

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
