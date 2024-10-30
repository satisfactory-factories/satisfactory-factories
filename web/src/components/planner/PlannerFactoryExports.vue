<template>
  <div>
    <h2 class="text-h5 mb-4">
      <i class="fa fa-truck-container" />
      <span class="ml-3">Exports</span>
    </h2>
    <div v-if="factory.products.length > 0">
      <p v-show="helpText" class="text-body-2 mb-4">
        <i class="fas fa-info-circle" /> Items listed below are the surplus of products available for
        export. They can be exported to other factories or sunk. To set up an export, create a new factory
        and use this factory as an import.
      </p>
      <p v-if="factory.surplus && Object.keys(factory.surplus).length === 0" class="text-body-1">
        No surplus products yet. Add a product!
      </p>

      <div v-if="factory.surplus && Object.keys(factory.surplus).length > 0">
        <p v-if="factory?.requirementsSatisfied === false" class="text-body-1 text-yellow-darken-3 mb-4">
          <i class="fas fa-exclamation-triangle" />
          <span class="ml-3">Factory Satisfaction is not fulfilled! The below numbers are not accurate to realistic output!</span>
        </p>
        <v-row
          v-for="surplus in exportsDisplay.filter(item => item !== null)"
          :key="`${factory.id}-${surplus?.productId}`"
          class="sub-card border-md my-4 mx-0 text-body-1 rounded d-flex"
          :style="requestStyling(factory, surplus.productId)"
        >
          <v-col class="border-e-md" cols="12" md="5">
            <div class="mb-4 d-flex align-center">
              <game-asset
                height="40"
                :subject="surplus.productId"
                type="item"
                width="40"
              />
              <span class="ml-2 text-h6">{{ getPartDisplayName(surplus.productId) }}</span>
            </div>
            <div v-if="getRequestsForFactoryByProduct(factory, surplus.productId).length > 0" class="mb-4">
              <span
                v-if="requestSatisfied(factory, surplus.productId)"
                class="text-green"
              >
                <i class="fas fa-check" />
                <span class="ml-2 font-weight-bold">Satisfied</span>
                <v-chip
                  class="ml-2"
                  color="green"
                >
                  <b>{{ getDifference(factory, surplus.productId) }}</b>&nbsp;available for export
                </v-chip>
              </span>
              <span
                v-if="!requestSatisfied(factory, surplus.productId)"
                class="text-red"
              >
                <span>
                  <i class="fas fa-times" />
                  <span class="ml-2 font-weight-bold">
                    Shortage of {{ getShortageAmount(factory, surplus.productId) }}/min
                  </span>
                  <v-btn
                    class="ml-2"
                    color="green"
                    size="small"
                    variant="flat"
                    @click="fixShortage(factory, getProduct(factory, surplus.productId))"
                  >Fix production</v-btn>
                </span>
              </span>
            </div>
            <div class="ml-n1">
              <v-chip class="ma-1 mt-0">
                <b>Surplus:</b>&nbsp;{{ factory.surplus[surplus.productId].amount }}/min
              </v-chip>
              <v-chip class="ma-1 mt-0">
                <b>Demands:</b>&nbsp;{{ getRequestMetricsForFactoryByPart(factory, surplus.productId)?.request ?? 0 }}/min
              </v-chip>
            </div>
            <div
              v-if="getRequestsForFactoryByProduct(factory, surplus.productId).length > 0"
              class="mt-2"
            >
              <p class="text-body-1 font-weight-bold mb-2">Requested by:</p>
              <v-chip
                v-for="request in getRequestsForFactoryByProduct(factory, surplus.productId)"
                :key="request.factoryId"
                class="sf-chip small"
                :color="isRequestSelected(factory, request.factoryId, surplus.productId) ? 'primary' : ''"
                :style="isRequestSelected(factory, request.factoryId, surplus.productId) ? 'border-color: rgb(0, 123, 255) !important' : ''"
                @click="changeCalculatorSelection(factory, request.factoryId, surplus.productId)"
              >
                <i class="fas fa-industry" />
                <span class="ml-2"><b>{{ findFactory(request.factoryId).name }}</b>: {{ request.amount }}/min</span>
              </v-chip>
            </div>
          </v-col>
          <v-col cols="12" md="7">
            <!-- Yeah good luck trying to get this to type check nicely -->
            <planner-factory-export-calculator
              v-if="isCalculatorReady(factory, surplus.productId)"
              :key="factory.exportCalculator.selected ?? surplus.productId"
              :dest-factory="findFactory(getCalculatorSettings(factory, surplus.productId).selected)"
              :dest-factory-settings="getCalculatorDestFacSettings(
                factory,
                surplus.productId,
                getCalculatorSettings(factory, surplus.productId).selected
              )"
              :factory="factory"
              :game-data="gameData"
              :help-text="helpText"
              :product="getProduct(factory, surplus.productId)"
              :request="getRequestForPartByDestFac(
                factory,
                surplus.productId,
                getCalculatorSettings(factory, surplus.productId).selected,
              )"
            />
            <div v-else class="text-center">
              <p class="text-h6 mb-4">
                <i class="fas fa-calculator" />
                <span class="ml-2">Export calculator</span>
              </p>
              <p class="font-weight-bold text-yellow-darken-3">
                No requests for export!
              </p>
              <p class="text-left">
                Add imports in other factories linking to this one. Otherwise, it is assumed you are sinking all these products.
              </p>
            </div>
          </v-col>
        </v-row>
      </div>
    </div>
    <p v-else class="text-body-1">Awaiting product selection.</p>
  </div>
</template>

<script setup lang="ts">
  import {
    ExportCalculatorFactorySettings,
    ExportCalculatorSettings,
    Factory,
    FactoryDependencyMetrics,
    FactoryDependencyRequest,
    FactoryItem, FactorySurplusItem,
  } from '@/interfaces/planner/FactoryInterface'
  import { DataInterface } from '@/interfaces/DataInterface'
  import { getPartDisplayName } from '@/utils/helpers'

  import PlannerFactoryExportCalculator from '@/components/planner/PlannerFactoryExportCalculator.vue'
  const findFactory = inject('findFactory') as (id: number) => Factory
  const updateFactory = inject('updateFactory') as (factory: Factory) => Factory
  const getProduct = inject('getProduct') as (factory: Factory, part: string) => FactoryItem

  const props = defineProps<{
    factory: Factory;
    gameData: DataInterface;
    helpText: boolean;
  }>()

  interface ExportsDisplay extends FactorySurplusItem {
    productId: string;
  }

  const exportsDisplay = computed((): ExportsDisplay[] => {
    // Get the surplus entries as key-value pairs
    const surplus = Object.entries(props.factory.surplus)

    // Map through the surplus to add the sort order from factory.products
    const surplusWithOrder = surplus.map(([key, value]) => {
      const product = props.factory.products.filter(product => product.id === key)[0]
      const byProduct = props.factory.byProducts.filter(product => product.id === key)[0]
      if (!product && !byProduct) {
        return null // Return null when product is not found, as it is not a surplus designated for export.
      }

      // If byproduct, we need to get the product to get the display order
      const productParent = byProduct ? props.factory.products.filter(product => product.id === byProduct.byProductOf)[0] : product
      const displayOrder = productParent?.displayOrder

      return {
        ...value,
        productId: key, // Add the product name to retain the reference
        displayOrder,
      } as ExportsDisplay
    })

    // Filter out any `null` values from the mapped array
    const filteredSurplusWithOrder = surplusWithOrder.filter((item): item is ExportsDisplay => item !== null)

    // Sort the filtered surplus entries based on sortOrder
    filteredSurplusWithOrder.sort((a, b) => {
      if (a.displayOrder && b.displayOrder) {
        return a.displayOrder - b.displayOrder
      } else if (a.displayOrder) {
        return 1 // Push entries without sortOrder to the end
      } else {
        return -1
      }
    })

    return filteredSurplusWithOrder
  })

  const requestStyling = (factory: Factory, productId: string) => {
    return {
      border: requestSatisfied(factory, productId) ? '2px solid rgb(97, 97, 97)' : '2px solid red !important',
    }
  }

  interface FactoryDependencyRequestDisplay extends FactoryDependencyRequest {
    factoryId: number;
  }

  const getRequestsForFactoryByProduct = (
    factory: Factory,
    part: string
  ): FactoryDependencyRequestDisplay[] => {
    // If sent an empty factory, there's no request.
    if (!factory) {
      return []
    }
    // Return an object containing the requests of all factories requesting a particular part
    // We need to get all requests set upon by other factories and check their part names
    // If the part name matches the one we're looking for, we add it to the list.
    const factoryRequests = factory.dependencies.requests

    if (Object.keys(factoryRequests).length === 0) {
      return []
    }

    // Create a new object returning the requests for the specific part, injecting the factory ID.
    // They can only ever request one part from us, so return it as a flat array.
    return Object.entries(factoryRequests).map(([factoryId, requests]) => {
      return requests.filter(request => request.part === part).map(request => {
        return {
          ...request,
          factoryId: parseInt(factoryId, 10),
        }
      })
    }).flat()
  }

  const getRequestForPartByDestFac = (factory: Factory, part: string, destFacId: string): FactoryDependencyRequest | undefined => {
    // Get the requests, then filter by the requesting factory to get the exact request for the port
    const requests = factory.dependencies.requests[destFacId]
    if (!requests) {
      return undefined
    }
    return requests.find(request => request.part === part)
  }

  const getRequestMetricsForFactoryByPart = (
    factory: Factory,
    part: string
  ): FactoryDependencyMetrics | undefined => {
    // Requests may be empty.
    if (!factory?.dependencies.metrics || !part || !factory.id) {
      return undefined
    }

    return factory.dependencies?.metrics[part] ?? {}
  }

  const requestSatisfied = (factory: Factory, part: string) => {
    const metric = getRequestMetricsForFactoryByPart(factory, part)

    if (!metric) {
      console.log(`Could not get request metric to calculate satisfaction for ${part}`)
      return false
    }

    // If there's no requests return true
    if (Object.keys(metric).length === 0) {
      return true
    }
    return metric.isRequestSatisfied
  }

  const getDifference = (factory: Factory, part: string): number => {
    return getRequestMetricsForFactoryByPart(factory, part)?.difference ?? -1234
  }

  const getShortageAmount = (factory: Factory, part: string): number => {
    return Math.abs(getDifference(factory, part))
  }

  const fixShortage = (factory: Factory, product: FactoryItem) => {
    const metric = getRequestMetricsForFactoryByPart(factory, product.id)

    if (!metric) {
      console.error(`Could not get request metric to fix shortage for ${product.id}`)
      return
    }

    const difference = Math.abs(metric.difference)
    product.amount = product.amount + difference
    updateFactory(factory)
  }

  const isCalculatorReady = (factory: Factory, part: string) => {
    const settings = getCalculatorSettings(factory, part)

    if (!settings?.selected) {
      return false
    }

    if (getRequestsForFactoryByProduct(factory, part).length === 0) {
      return false
    }

    return getCalculatorDestFacSettings(factory, part, settings.selected)?.trainTime !== undefined
  }

  const changeCalculatorSelection = (factory: Factory, factoryId: number, part: string) => {
    factory.exportCalculator[part].selected = factoryId.toString()
  }

  const isRequestSelected = (factory: Factory, factoryId: number, part: string) => {
    return factory.exportCalculator[part].selected === factoryId.toString()
  }

  const getCalculatorSettings = (factory: Factory, part: string | null): ExportCalculatorSettings | undefined => {
    if (part === null) {
      console.error(`Could not get calculator settings for invalid part ${part}`)
      return undefined
    }
    return factory.exportCalculator[part]
  }

  const getCalculatorDestFacSettings = (
    factory: Factory,
    part: string,
    destFactoryId: string | null
  ): ExportCalculatorFactorySettings => {
    if (destFactoryId === null) {
      console.error(`Could not get calculator factory settings for invalid factory ${destFactoryId}`)
      return { trainTime: 123 }
    }
    return factory.exportCalculator[part].factorySettings[destFactoryId]
  }
</script>

<style lang="scss" scoped>
.v-card-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}
</style>
