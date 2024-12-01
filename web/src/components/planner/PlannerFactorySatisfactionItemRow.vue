<template>
  <v-row class="mx-0 my-2 px-2 pl-4" :class="classes" style="height: 60px">
    <v-col class="flex-grow-0 pa-0 align-content-center">
      <game-asset
        height="48"
        :subject="partId"
        type="item"
        width="48"
      />
    </v-col>
    <v-col class="py-0 align-content-center">
      <div>
        <div class="mb-1">
          <span v-if="part.satisfied">
            <v-icon icon="fas fa-check" />
          </span>
          <span v-else>
            <v-icon icon="fas fa-times" />
          </span>
          <span class="ml-2"><b>{{ getPartDisplayName(partId) }}</b></span>
        </div>
        <div class="mb-1">
          <v-tooltip bottom>
            <template #activator="{ props }">
              <v-chip class="sf-chip small gray no-border ma-0" v-bind="props">
                <b>S: {{ part.amountSupplied }}</b>
              </v-chip> -
            </template>
            <p>Supply: {{ part.amountSupplied }} /min</p>
            <ul class="ml-3">
              <li>From production: {{ part.amountSuppliedViaProduction }} /min</li>
              <li>From imports / raw extraction: {{ part.amountSuppliedViaInput }} /min</li>
            </ul>
          </v-tooltip>
          <v-tooltip bottom>
            <template #activator="{ props }">
              <v-chip class="sf-chip small gray no-border ma-0" v-bind="props">
                <b>D: {{ part.amountRequired }}</b>
              </v-chip> =
            </template>
            <p>Demands: {{ part.amountRequired }} /min</p>
            <ul class="ml-3">
              <li>From production: {{ part.amountRequiredProduction }} /min</li>
              <li>From exports: {{ part.amountRequiredExports }} /min</li>
            </ul>
          </v-tooltip>
          <b>{{ part.amountRemaining }} /min</b>
        </div>
      </div>
      <div class="mx-n1">
        <v-btn
          v-if="!getProduct(factory, partId) && !isItemRawResource(partId) && !part.satisfied"
          class="ma-1"
          color="primary"
          size="small"
          variant="outlined"
          @click="addProduct(factory, partId, part.amountRemaining)"
        >+&nbsp;<i class="fas fa-cube" /><span class="ml-1">Product</span>
        </v-btn>
        <v-btn
          v-if="getProduct(factory, partId) && !isItemRawResource(partId) && !part.satisfied"
          class="ma-1"
          color="green"
          size="small"
          @click="fixProduction(factory, partId)"
        ><i class="fas fa-wrench" /><span class="ml-1">Fix Production</span>
        </v-btn>
        <v-btn
          v-if="getImport(factory, partId) && !part.satisfied"
          class="ma-1"
          color="green"
          size="small"
          @click="fixSatisfactionImport(factory, partId)"
        >&nbsp;<i class="fas fa-arrow-up" /><span class="ml-1">Fix Import</span>
        </v-btn>
      </div>
    </v-col>
  </v-row>

</template>

<script setup lang="ts">
  import { inject } from 'vue'
  import { getPartDisplayName } from '@/utils/helpers'
  import { Factory, FactoryInput, FactoryItem, PartMetrics } from '@/interfaces/planner/FactoryInterface'
  import { addProductToFactory } from '@/utils/factory-management/products'
  import { useGameDataStore } from '@/stores/game-data-store'

  const getProduct = inject('getProduct') as (factory: Factory, productId: string) => FactoryItem | undefined
  const isItemRawResource = inject('isItemRawResource') as (part: string) => boolean
  const updateFactory = inject('updateFactory') as (factory: Factory) => void
  const fixProduction = inject('fixProduction') as (factory: Factory, partIndex: string) => void

  const { getDefaultRecipeForPart } = useGameDataStore()

  const compProps = defineProps<{
    factory: Factory;
    part: PartMetrics;
    partId: string;
  }>()

  const partId = ref<string>(compProps.partId)

  const classes = computed(() => {
    return {
      'text-green': compProps.part.satisfied,
      'text-red': !compProps.part.satisfied,
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
