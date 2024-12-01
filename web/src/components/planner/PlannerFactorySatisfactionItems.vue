<template>
  <v-table class="rounded border-md sub-card">
    <thead>
      <tr>
        <th class="text-h6 text-left border-e-md">Item</th>
        <th class="d-flex text-h6 text-left border-e-md align-center">
          Exportable
          <span class="ml-2 text-caption text-grey">
            <v-tooltip bottom>
              <template #activator="{ props }">
                <div v-bind="props">
                  <v-icon
                    icon="fas fa-info-circle"
                  />
                </div>
              </template>
              <span>Amount of the item that is available for export, after internal production needs and other export requests are taken into account.</span>
            </v-tooltip>
          </span>
        </th>
        <th class="text-h6 text-left border-e-md">Supply</th>
        <th class="text-h6 text-left border-e-md">Demand</th>
        <th class="text-h6 text-left">Exports</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(part, partId) in factory.parts" :key="partId">
        <td class="border-e-md">
          <div class="d-flex align-center" :class="classes(part)">
            <game-asset
              height="48"
              :subject="partId.toString()"
              type="item"
              width="48"
            />
            <span v-if="part.satisfied" class="ml-2">
              <v-icon icon="fas fa-check" />
            </span>
            <span v-else class="ml-2">
              <v-icon icon="fas fa-times" />
            </span>
            <span class="ml-2 text-body-1"><b>{{ getPartDisplayName(partId) }}</b></span>
          </div>
        </td>
        <td class="border-e-md">
          <v-chip
            class="sf-chip blue"
          >
            {{ part.amountRemaining }}/min
          </v-chip>
        </td>
        <td class="border-e-md">
          <v-chip
            class="sf-chip small no-border"
          >
            <b>Production</b>: {{ part.amountSuppliedViaProduction }}/min
          </v-chip><br>
          <v-chip
            class="sf-chip small no-border"
          >
            <b>Imports</b>: {{ part.amountSuppliedViaInput }}/min
          </v-chip>
          <br>
          <v-chip
            class="sf-chip small"
          >
            <b>Total</b>: {{ part.amountSuppliedViaInput }}/min
          </v-chip>
        </td>
        <td class="border-e-md">
          <v-chip
            class="sf-chip small no-border"
          >
            <b>Production</b>: {{ part.amountRequiredProduction }}/min
          </v-chip>
          <br>
          <v-chip
            class="sf-chip small no-border"
          >
            <b>Exports</b>: {{ part.amountRequiredExports }}/min
          </v-chip>
          <br>
          <v-chip
            class="sf-chip small"
          >
            <b>Total</b>: {{ part.amountRequired }}/min
          </v-chip>
        </td>
        <td>
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
        </td>
      </tr>
    </tbody>
  </v-table>
</template>

<script setup lang="ts">
  import { inject } from 'vue'
  import { getPartDisplayName } from '@/utils/helpers'
  import { Factory, FactoryInput, FactoryItem } from '@/interfaces/planner/FactoryInterface'
  import { addProductToFactory } from '@/utils/factory-management/products'
  import { useGameDataStore } from '@/stores/game-data-store'

  const getProduct = inject('getProduct') as (factory: Factory, productId: string) => FactoryItem | undefined
  const isItemRawResource = inject('isItemRawResource') as (part: string) => boolean
  const updateFactory = inject('updateFactory') as (factory: Factory) => void
  const fixProduction = inject('fixProduction') as (factory: Factory, partIndex: string) => void

  const { getDefaultRecipeForPart } = useGameDataStore()

  defineProps<{
    factory: Factory;
  }>()

  const classes = part => {
    return {
      'text-green': part.satisfied,
      'text-red': !part.satisfied,
    }
  }

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
