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
    <p v-if="factory.exports && Object.keys(factory.exports).length === 0" class="text-body-1">
      No difference products yet. Add a product!
    </p>

    <div v-if="factory.exports && Object.keys(factory.exports).length > 0">
      <p v-if="factory?.requirementsSatisfied === false" class="text-body-1 text-yellow-darken-3 mb-4">
        <i class="fas fa-exclamation-triangle" />
        <span class="ml-3">Factory Satisfaction is not fulfilled! The below numbers are not accurate to realistic output!</span>
      </p>
      <v-row
        v-for="exportItem in factory.exports"
        :key="`${factory.id}-${exportItem.productId}`"
        class="sub-card border-md my-4 mx-0 text-body-1 rounded d-flex no-bottom"
        :style="requestStyling(factory, exportItem.productId)"
      >
        <v-col class="border-e-md" cols="12" md="5">
          <div class="mb-4 d-flex align-center">
            <game-asset
              height="48"
              :subject="exportItem.productId"
              type="item"
              width="48"
            />
            <span class="ml-2 text-h6">{{ getPartDisplayName(exportItem.productId) }}</span>
          </div>
          <div class="mb-4">
            <span
              v-if="exportItem.surplus >= 0"
              class="text-green"
            >
              <i class="fas fa-check" />
              <span class="ml-2 font-weight-bold">Satisfied</span>
              <v-chip
                class="ml-2"
                color="green"
              >
                <b>{{ formatNumber(exportItem.surplus) }}</b>/min available for export
              </v-chip>
            </span>
            <span
              v-if="exportItem.surplus < 0"
              class="text-red"
            >
              <span>
                <i class="fas fa-times" />
                <span class="ml-2 font-weight-bold">
                  Shortage of {{ formatNumber(Math.abs(exportItem.surplus)) }}/min
                </span>
                <v-btn
                  class="ml-2"
                  color="green"
                  size="small"
                  variant="flat"
                  @click="fixExport(factory, exportItem.productId)"
                >Fix Production</v-btn>
              </span>
            </span>
          </div>
          <div class="ml-n1">
            <v-chip class="ma-1 mt-0">
              <b>Total Export Demands:</b>&nbsp;{{ formatNumber(exportItem.demands) }}/min
            </v-chip>
          </div>
          <div
            v-if="getRequestsForFactoryByProduct(factory, exportItem.productId).length > 0"
            class="mt-4"
          >
            <p class="text-body-1 font-weight-bold mb-2">Requested by:</p>
            <v-chip
              v-for="(request, factoryId) in getRequestsForFactoryByProduct(factory, exportItem.productId)"
              :key="factoryId"
              class="sf-chip small mb-0"
              :color="isRequestSelected(factory, request.requestingFactoryId, exportItem.productId) ? 'primary' : ''"
              :style="isRequestSelected(factory, request.requestingFactoryId, exportItem.productId) ? 'border-color: rgb(0, 123, 255) !important' : ''"
              @click="changeCalculatorSelection(factory, request.requestingFactoryId, exportItem.productId)"
            >
              <i class="fas fa-industry" />
              <span class="ml-2"><b>{{ findFactory(request.requestingFactoryId).name }}</b>: {{ formatNumber(request.amount) }}/min</span>
            </v-chip>
          </div>
        </v-col>
        <v-col cols="12" md="7">
          <planner-factory-export-calculator
            v-if="isCalculatorReady(factory, exportItem.productId)"
            :key="`${factory.id}-${exportItem.productId}`"
            :dest-factory="findFactory(Number(getCalculatorSettings(factory, exportItem.productId)!.selected))"
            :dest-factory-settings="getCalculatorDestFacSettings(
              factory,
              exportItem.productId,
              getCalculatorSettings(factory, exportItem.productId)!.selected
            )"
            :factory="factory"
            :game-data="gameData"
            :help-text="helpText"
            :product="getProduct(factory, exportItem.productId)"
            :request="getRequestForPartByDestFac(
              factory,
              exportItem.productId,
              getCalculatorSettings(factory, exportItem.productId)!.selected!,
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
    FactoryItem,
  } from '@/interfaces/planner/FactoryInterface'
  import { DataInterface } from '@/interfaces/DataInterface'
  import { getPartDisplayName } from '@/utils/helpers'
  import { formatNumber } from '@/utils/numberFormatter'
  import PlannerFactoryExportCalculator from '@/components/planner/PlannerFactoryExportCalculator.vue'
  import { getRequestsForFactoryByProduct } from '@/utils/factory-management/exports'

  const findFactory = inject('findFactory') as (id: number) => Factory
  const fixExport = inject('fixExport') as (factory: Factory, productId: string) => void
  const getProduct = inject('getProduct') as (factory: Factory, productId: string) => FactoryItem
  const getRequestMetricsForFactoryByPart = inject('getRequestMetricsForFactoryByPart') as (factory: Factory, part: string) => FactoryDependencyMetrics | undefined

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

  const getRequestForPartByDestFac = (factory: Factory, part: string, destFacId: string): FactoryDependencyRequest | undefined => {
    // Get the requests, then filter by the requesting factory to get the exact request for the port
    const requests = factory.dependencies.requests[destFacId]
    if (!requests) {
      return undefined
    }
    return requests.find(request => request.part === part)
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
