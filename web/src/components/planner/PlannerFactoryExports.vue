<template>
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
        v-for="exportItem in exportsDisplay.filter(item => item !== null)"
        :key="`${factory.id}-${exportItem?.id}`"
        class="sub-card border-md my-4 mx-0 text-body-1 rounded d-flex no-bottom"
        :style="requestStyling(factory, exportItem.id)"
      >
        <v-col class="border-e-md" cols="12" md="5">
          <div class="mb-4 d-flex align-center">
            <game-asset
              height="48"
              :subject="exportItem.id"
              type="item"
              width="48"
            />
            <span class="ml-2 text-h6">{{ getPartDisplayName(exportItem.id) }}</span>
          </div>
          <div v-if="getRequestsForFactoryByProduct(factory, exportItem.id).length > 0" class="mb-4">
            <span
              v-if="requestSatisfied(factory, exportItem.id)"
              class="text-green"
            >
              <i class="fas fa-check" />
              <span class="ml-2 font-weight-bold">Satisfied</span>
              <v-chip
                class="ml-2"
                color="green"
              >
                <b>{{ formatNumber(getDifference(factory, exportItem.id)) }}</b>&nbsp;available for export
              </v-chip>
            </span>
            <span
              v-if="!requestSatisfied(factory, exportItem.id)"
              class="text-red"
            >
              <span>
                <i class="fas fa-times" />
                <span class="ml-2 font-weight-bold">
                  Shortage of {{ formatNumber(getShortageAmount(factory, exportItem.id)) }}/min
                </span>
                <v-btn
                  class="ml-2"
                  color="green"
                  size="small"
                  variant="flat"
                  @click="fixShortage(factory, getProduct(factory, exportItem.id))"
                >Fix production</v-btn>
              </span>
            </span>
          </div>
          <div class="ml-n1">
            <v-chip class="ma-1 mt-0">
              <b>Surplus:</b>&nbsp;{{ formatNumber(factory.surplus[exportItem.id]?.amount ?? 0) }}/min
            </v-chip>
            <v-chip class="ma-1 mt-0">
              <b>Demands:</b>&nbsp;{{ formatNumber(getRequestMetricsForFactoryByPart(factory, exportItem.id)?.request ?? 0) }}/min
            </v-chip>
          </div>
          <div
            v-if="getRequestsForFactoryByProduct(factory, exportItem.id).length > 0"
            class="mt-4"
          >
            <p class="text-body-1 font-weight-bold mb-2">Requested by:</p>
            <v-chip
              v-for="request in getRequestsForFactoryByProduct(factory, exportItem.id)"
              :key="request.factoryId"
              class="sf-chip small mb-0"
              :color="isRequestSelected(factory, request.factoryId, exportItem.id) ? 'primary' : ''"
              :style="isRequestSelected(factory, request.factoryId, exportItem.id) ? 'border-color: rgb(0, 123, 255) !important' : ''"
              @click="changeCalculatorSelection(factory, request.factoryId, exportItem.id)"
            >
              <i class="fas fa-industry" />
              <span class="ml-2"><b>{{ findFactory(request.factoryId).name }}</b>: {{ formatNumber(request.amount) }}/min</span>
            </v-chip>
          </div>
        </v-col>
        <v-col cols="12" md="7">
          <planner-factory-export-calculator
            v-if="isCalculatorReady(factory, exportItem.id)"
            :key="`${factory.id}-${exportItem.id}`"
            :dest-factory="findFactory(Number(getCalculatorSettings(factory, exportItem.id)!.selected))"
            :dest-factory-settings="getCalculatorDestFacSettings(
              factory,
              exportItem.id,
              getCalculatorSettings(factory, exportItem.id)!.selected
            )"
            :factory="factory"
            :game-data="gameData"
            :help-text="helpText"
            :product="getProduct(factory, exportItem.id)"
            :request="getRequestForPartByDestFac(
              factory,
              exportItem.id,
              getCalculatorSettings(factory, exportItem.id)!.selected!,
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
            <p class="text-center">
              Add imports in other factories linking to this one. Otherwise, it is assumed you are sinking all these products.
            </p>
          </div>
        </v-col>
      </v-row>
    </div>
  </div>
  <p v-else class="text-body-1">Awaiting product selection.</p>
</template>

<script setup lang="ts">
  import {
    ExportCalculatorFactorySettings,
    ExportCalculatorSettings,
    Factory,
    FactoryDependencyMetrics,
    FactoryDependencyRequest,
    FactoryExportItem, FactoryItem,
  } from '@/interfaces/planner/FactoryInterface'
  import { DataInterface } from '@/interfaces/DataInterface'
  import { getPartDisplayName } from '@/utils/helpers'
  import { formatNumber } from '@/utils/numberFormatter'

  import PlannerFactoryExportCalculator from '@/components/planner/PlannerFactoryExportCalculator.vue'
  const findFactory = inject('findFactory') as (id: number) => Factory
  const updateFactory = inject('updateFactory') as (factory: Factory) => Factory
  const getProduct = inject('getProduct') as (factory: Factory, part: string) => FactoryItem

  const props = defineProps<{
    factory: Factory;
    gameData: DataInterface;
    helpText: boolean;
  }>()

  const getExportsDisplay = (factory: Factory): FactoryExportItem[] => {
    // Get the products from the factory, and filter out any products that BOTH do not have a surplus and are NOT requested by other factories
    const products = Object.entries(factory.products ?? {})
    if (products.length === 0) {
      return []
    }

    // Map through the products and check if the product both has a surplus or requests set upon it
    const exports = products.map(([key, product]) => {
      // Now check if the product has any demands set upon it by other factories
      const requests = getRequestsForFactoryByProduct(factory, product.id)
      const hasSurplus = factory.surplus[product.id] ?? false

      if (requests.length === 0 && !hasSurplus) {
        return null // Return null when product is not requested by other factories and has no surplus
      }

      const byProduct = factory.byProducts.find(byProduct => byProduct.id === product.id)

      // If byproduct, we need to get the product to get the display order
      const productParent = byProduct ? factory.products.filter(product => product.id === byProduct.byProductOf)[0] : product
      const displayOrder = productParent?.displayOrder

      return {
        ...product,
        productId: key, // Add the product name to retain the reference
        surplus: hasSurplus.amount ?? 0,
        demands: requests.reduce((acc, request) => acc + request.amount, 0),
        displayOrder,
      } as FactoryExportItem
    })

    // Filter out any `null` values from the mapped array, keeps typescript happy
    const validExports = exports.filter((item): item is FactoryExportItem => item !== null)

    // Sort the filtered surplus entries based on sortOrder
    validExports.sort((a, b) => {
      if (a.displayOrder && b.displayOrder) {
        return a.displayOrder - b.displayOrder
      } else if (a.displayOrder) {
        return 1 // Push entries without sortOrder to the end
      } else {
        return -1
      }
    })

    return validExports
  }

  const exportsDisplay = computed((): FactoryExportItem[] => {
    return getExportsDisplay(props.factory) // Proxied like this so we can test it better
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
