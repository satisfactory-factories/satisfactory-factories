<template>
  <div>
    <h2 class="text-h5 mb-4"><i class="fa fa-truck-container" /> Exports</h2>
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
          v-for="product in factory.products.filter(product => factory.surplus[product.id]).sort((a, b) => a.displayOrder - b.displayOrder)"
          :key="`${factory.id}-${product.id}`"
          class="sub-card border-md my-4 mx-0 text-body-1 rounded d-flex"
          :style="requestStyling(factory, product.id)"
        >
          <v-col class="border-e-md" cols="12" md="5">
            <div class="mb-4 d-flex align-center">
              <game-asset
                height="40"
                :subject="product.id"
                type="item"
                width="40"
              />
              <span class="ml-2 text-h5">{{ getPartDisplayName(product.id) }}</span>
            </div>
            <div class="mb-4">
              <span
                v-if="requestSatisfied(factory, product.id)"
                class="text-green"
              >
                <i class="fas fa-check" /><span class="ml-2 font-weight-bold">Satisfied</span>
              </span>
              <span
                v-if="!requestSatisfied(factory, product.id)"
                class="text-red"
              >
                <span>
                  <i class="fas fa-times" />
                  <span class="ml-2 font-weight-bold">
                    Shortage of {{ getShortageAmount(factory, product.id) }}/min
                  </span>
                  <v-btn
                    class="ml-2"
                    color="primary"
                    size="small"
                    variant="outlined"
                    @click="fixShortage(factory, product)"
                  >Fix production</v-btn>
                </span>
              </span>
            </div>
            <div class="mb-4">
              <v-chip>
                <b>Surplus:</b>&nbsp;{{ factory.surplus[product.id].amount }}/min
              </v-chip>
              <v-chip class="ml-2">
                <b>Demands:</b>&nbsp;{{ getRequestMetricsForFactoryByPart(factory, product.id).request ?? 0 }}/min
              </v-chip>
            </div>
            <div
              v-if="getRequestsForFactoryByProduct(factory, product.id).length > 0"
            >
              <p class="text-body-1 font-weight-bold mb-2">Requested by:</p>
              <v-chip
                v-for="request in getRequestsForFactoryByProduct(factory, product.id)"
                :key="request.factory"
                class="mr-2 mb-2 border-md border-gray"
                :color="isRequestSelected(factory, request.factory) ? 'primary' : ''"
                :style="isRequestSelected(factory, request.factory) ? 'border-color: rgb(0, 123, 255) !important' : ''"
                @click="changeCalculatorSelection(factory, request.factory)"
              >
                <i class="fas fa-industry" />
                <span class="ml-2"><b>{{ findFactory(request.factory).name }}</b>: {{ request.amount }}/min</span>
              </v-chip>
            </div>
            <div v-else>
              <p class="mt-2">
                <b>No requests for export!</b><br>Add imports in other factories linking to this one. It is assumed you are sinking all these products.
              </p>
            </div>
          </v-col>
          <v-col cols="12" md="7">
            <planner-factory-export-calculator
              v-if="factory.exportCalculator.selected"
              :key="factory.exportCalculator.selected"
              :calculator-settings="factory.exportCalculator.settings[factory.exportCalculator.selected]"
              :dest-factory="findFactory(factory.exportCalculator.selected)"
              :factory="factory"
              :game-data="gameData"
              :help-text="helpText"
              :product="product"
              :request="getRequestForPartByDestFac(factory, factory.exportCalculator.selected, product.id)"
            />
            <div v-else class="text-center">
              <p class="text-h5 mb-2">
                <i class="fas fa-calculator" />
                <span class="ml-2">Export calculator</span>
              </p>
              <p>Nothing to calculate.</p>
            </div>

          </v-col>
        </v-row>
      </div>
      <p v-else class="text-body-1">Awaiting product selection.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
  import {
    Factory,
    FactoryDependencyMetrics,
    FactoryDependencyRequest,
    FactoryItem,
  } from '@/interfaces/planner/FactoryInterface'
  import { DataInterface } from '@/interfaces/DataInterface'
  import PlannerFactoryExportCalculator from '@/components/planner/PlannerFactoryExportCalculator.vue'

  const findFactory = inject('findFactory') as (id: number) => Factory
  const updateFactory = inject('updateFactory') as (id: number) => Factory
  const getPartDisplayName = inject('getPartDisplayName') as (part: string) => string
  const navigateToFactory = inject('navigateToFactory') as (id: number) => void

  defineProps<{
    factory: Factory;
    gameData: DataInterface;
    helpText: boolean;
  }>()

  const requestStyling = (factory: Factory, productId: string) => {
    return {
      border: requestSatisfied(factory, productId) ? '2px solid rgb(97, 97, 97)' : '2px solid red !important',
    }
  }

  const getRequestsForFactoryByProduct = (
    factory: Factory | string,
    part: string
  ): FactoryDependencyRequest[] => {
    // If sent an empty factory, there's no request.
    if (!factory) {
      return []
    }
    // Return an object containing the requests of all factories requesting a particular part
    // We need to get all requests set upon by other factories and check their part names
    // If the part name matches the one we're looking for, we add it to the list.
    const factoryRequests = factory.dependencies.requests

    if (!factoryRequests || factoryRequests.length === 0) {
      return []
    }

    // Create a new object returning the requests for the specific part, injecting the factory ID.
    // They can only ever request one part from us, so return it as a flat array.
    return Object.entries(factoryRequests).map(([factoryId, requests]) => {
      return requests.filter(request => request.part === part).map(request => {
        return {
          ...request,
          factory: factoryId,
        }
      })
    }).flat()
  }

  const getRequestForPartByDestFac = (factory: Factory, destFacId: string, part: string) => {
    // Get the requests, then filter by the requesting factory to get the exact request for the port
    const requests = factory.dependencies.requests[destFacId]
    if (!requests) {
      return null
    }
    return requests.find(request => request.part === part)
  }

  const getRequestMetricsForFactoryByPart = (
    factory: Factory,
    part: string
  ): FactoryDependencyMetrics => {
    // Requests may be empty.
    if (!factory?.dependencies.metrics || !part || !factory.id) {
      return {}
    }

    return factory.dependencies?.metrics[part] ?? {}
  }

  const requestSatisfied = (factory: Factory, part: string) => {
    const metric = getRequestMetricsForFactoryByPart(factory, part)

    // If there's no requests return true
    if (Object.keys(metric).length === 0) {
      return true
    }
    return metric.isRequestSatisfied
  }

  const getShortageAmount = (factory: factory, part: string) => {
    return Math.abs(getRequestMetricsForFactoryByPart(factory, part).difference ?? -1234)
  }

  const fixShortage = (factory: Factory, product: FactoryItem) => {
    const metric = getRequestMetricsForFactoryByPart(factory, product.id)
    const difference = Math.abs(metric.difference)
    product.amount = parseInt(product.amount) + parseInt(difference)
    updateFactory(factory)
  }

  const changeCalculatorSelection = (factory: Factory, factoryId: string) => {
    factory.exportCalculator.selected = factoryId
  }

  const isRequestSelected = (factory: Factory, factoryId: string) => {
    return factory.exportCalculator.selected === factoryId
  }
</script>

<style lang="scss" scoped>
.v-card-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}
</style>
