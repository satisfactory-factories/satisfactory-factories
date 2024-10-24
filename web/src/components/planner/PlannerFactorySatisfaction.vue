<template>
  <div>
    <h2
      v-show="factory.requirementsSatisfied && Object.keys(factory.parts).length > 0"
      class="text-h5 mb-4"
    >
      <i class="fas fa-check" />
      <span class="ml-3">Satisfaction</span>
    </h2>
    <h2
      v-show="!factory.requirementsSatisfied"
      class="text-h5 mb-4 text-red"
    >
      <i class="fas fa-times" />
      <span class="ml-3">Satisfaction</span>
    </h2>
    <h2
      v-show="factory.requirementsSatisfied && Object.keys(factory.parts).length === 0"
      class="text-h5 mb-4"
    >
      <i class="fas fa-question" />
      <span class="ml-3">Satisfaction</span>
    </h2>

    <v-row v-if="Object.keys(factory.parts).length > 0">
      <v-col cols="12" md="7">
        <v-card class="border-md sub-card">
          <v-card-title>
            <h2 class="text-h6">
              <i class="fas fa-cube" /><span class="ml-2">Items</span>
            </h2>
          </v-card-title>
          <v-card-text class="text-body-1 pb-0 pt-2">
            <p v-show="helpText" class="text-body-2 mb-4">
              <i class="fas fa-info-circle" /> Listed as [supply/demand]. Supply is created by adding imports to the factory or producing the product internally.
            </p>
            <v-row
              v-for="(part, partId) in satisfactionDisplay"
              :key="partId"
              class="mx-n4 mb-2 pb-2 border-b no-bottom"
              :class="isSatisfiedStyling(part)"
            >
              <v-col align-self="center" class="flex-grow-0 pa-0 pl-3">
                <game-asset
                  height="40"
                  :subject="partId"
                  type="item"
                  width="40"
                />
              </v-col>
              <v-col class="py-0">
                <p v-if="part.satisfied">
                  <v-icon icon="fas fa-check" />
                  <span class="ml-2"><b>{{ getPartDisplayName(partId) }}</b><br>{{ part.amountSupplied }}/{{ part.amountRequired }}/min</span>
                </p>
                <p v-else>
                  <v-icon icon="fas fa-times" />
                  <span class="ml-2">
                    <span>
                      <b>{{ getPartDisplayName(partId) }}</b><br>{{ part.amountSupplied }}/{{ part.amountRequired }} /min
                    </span>
                  </span>
                </p>
              </v-col>
              <v-col align-self="center" class="text-right flex-shrink-0 py-0">
                <v-btn
                  v-if="!getProduct(factory, partId) && !isItemRawResource(partId) && !part.satisfied"
                  class="ml-2 my-1"
                  color="primary"
                  size="small"
                  variant="outlined"
                  @click="addProduct(factory, partId)"
                >+&nbsp;<i class="fas fa-cube" /><span class="ml-1">Product</span>
                </v-btn>
                <v-btn
                  v-if="getProduct(factory, partId) && !isItemRawResource(partId) && !part.satisfied"
                  class="ml-2 my-1"
                  color="primary"
                  size="small"
                  variant="outlined"
                  @click="fixProduction(factory, partId)"
                ><i class="fas fa-wrench" /><span class="ml-1">Fix Production</span>
                </v-btn>
                <v-btn
                  v-if="getImport(factory, partId) && !part.satisfied"
                  class="ml-2 my-1"
                  color="green"
                  size="small"
                  variant="outlined"
                  @click="fixSatisfactionImport(factory, partId)"
                >&nbsp;<i class="fas fa-wrench" /><span class="ml-1">Fix Import</span>
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="5">
        <v-card class="sub-card border-md">
          <v-card-title>
            <h2 class="text-h6">
              <i class="fas fa-building" />
              <span class="ml-3">Buildings & Power</span>
            </h2>
          </v-card-title>
          <v-card-text class="text-body-1">
            <div
              v-for="(building, buildingIndex) in factory.buildingRequirements"
              :key="buildingIndex"
              style="display: inline;"
            >
              <v-chip
                class="mr-2 border-md py-5 mb-2"
                color="yellow-darken-4"
                size="large"
                style="border-color: rgb(167, 86, 0)!important"
                variant="tonal"
              >
                <game-asset
                  class="mr-2"
                  :subject="building.name"
                  type="building"
                />
                <b>{{ getBuildingDisplayName(building.name) ?? 'UNKNOWN' }}</b>: {{ building.amount ?? 0 }}x
              </v-chip>
            </div>
            <v-chip
              class="mr-2 border-md py-5 mb-2"
              color="yellow-darken-2"
              size="large"
              style="border-color: rgb(172, 153, 2) !important"
              variant="tonal"
            ><i class="fas fa-bolt" /><span class="ml-2">{{ factory.totalPower?.toFixed(0) ?? 0 }} MW</span>
            </v-chip>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    <p v-else class="text-body-1">Awaiting product selection or requirements outside of Raw Resources.</p>
  </div>
</template>
<script setup lang="ts">
  import { Factory, FactoryImport, FactoryItem, PartMetrics } from '@/interfaces/planner/FactoryInterface'

  const getPartDisplayName = inject('getPartDisplayName') as (part: string) => string
  const getBuildingDisplayName = inject('getBuildingDisplayName') as (part: string) => string
  const updateFactory = inject('updateFactory') as (part: string) => string
  const isItemRawResource = inject('isItemRawResource') as (part: string) => boolean

  const props = defineProps<{
    factory: Factory;
    helpText: boolean;
  }>()

  // Calculated function showing parts displayed if the amountRequired > 0
  const satisfactionDisplay = computed(() => {
    const parts = Object.entries(props.factory.parts)
      .filter(([_, value]) => value.amountRequired > 0)
      .reduce((acc, [key, value]) => {
        acc[key] = value
        return acc
      }, {})

    console.log(parts)
    return parts
  })

  const isSatisfiedStyling = (part: PartMetrics) => {
    return {
      'text-green': part.satisfied,
      'text-red': !part.satisfied,
    }
  }

  const getProduct = (factory, part: string): FactoryItem => {
    return factory.products.find(product => product.id === part)
  }

  const addProduct = (factory, part: string): void => {
    factory.products.push({
      id: part,
      amount: 0,
      recipe: '',
      displayOrder: factory.products.length,
      requirements: {},
      buildingRequirements: {},
    })
    updateFactory(factory)
  }

  const getImport = (factory, partIndex: string): FactoryImport => {
    // Search the inputs array for the outputPart using the part index
    return factory.inputs.find(input => input.outputPart === partIndex)
  }

  const fixProduction = (factory, partIndex: string | number) => {
    const product = getProduct(factory, partIndex)

    // If the product is not found, return
    if (!product) {
      console.error(`Could not find product for ${partIndex} to fix!`)
    }

    // Update the production amount to match requirement
    product.amount = factory.parts[partIndex].amountRequired
    updateFactory(factory)
  }

  const fixSatisfactionImport = (factory: Factory, partIndex: string | number) => {
    const itemImport = getImport(factory, partIndex)

    // If the import is not found, return
    if (!itemImport) return

    // Set the import amount to the required amount
    itemImport.amount = factory.parts[partIndex].amountRequired
    updateFactory(factory)
  }
</script>
