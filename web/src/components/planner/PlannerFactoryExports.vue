<template>
  <div>
    <h2 class="text-h4 mb-4"><i class="fa fa-truck-container" /> Exports</h2>
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
        <div class="v-card-grid">
          <div v-for=" (product) in factory.products.filter(product => factory.surplus[product.id]).sort((a, b) => a.displayOrder - b.displayOrder)" :key="`${factory.id}-${product.id}`">
            <v-card
              v-if="factory.surplus[product.id]"
              class="my-card border-md mb-1"
              :style="requestStyling(getRequestMetricsForFactoryByPart(factory, product.id))"
            >
              <v-card-title>
                <h2 class="text-h5">
                  <i class="fas fa-cube" /><span class="ml-2">{{ getPartDisplayName(product.id) }}</span>
                </h2>
              </v-card-title>
              <v-card-text class="text-body-1">
                <p><b>Surplus</b>: {{ factory.surplus[product.id].amount }}/min</p>
                <div v-if="getRequestsForFactoryByProduct(factory, product.id).length > 0">
                  <p><b>Requests</b>: {{ getRequestMetricsForFactoryByPart(factory, product.id).request }}/min</p>
                  <p>Status:
                    <span
                      v-if="getRequestMetricsForFactoryByPart(factory, product.id).isRequestSatisfied"
                      class="text-green"
                    >
                      <i class="fas fa-check" /><span class="ml-2 font-weight-bold">Satisfied</span>
                    </span>
                    <span
                      v-if="!getRequestMetricsForFactoryByPart(factory, product.id).isRequestSatisfied"
                      class="text-red"
                    >
                      <span>
                        <i class="fas fa-times" /><span class="ml-2 font-weight-bold">Shortage of {{ Math.abs(getRequestMetricsForFactoryByPart(factory, product.id).difference) }}/min</span>
                        <v-btn
                          class="ml-2"
                          color="primary"
                          size="small"
                          variant="outlined"
                          @click="fixShortage(factory, product)"
                        >Fix production</v-btn>
                      </span>
                    </span>
                  </p>
                  <div class="my-4">
                    <p class="text-h6"><b>Requests:</b></p>
                    <v-chip
                      v-for="request in getRequestsForFactoryByProduct(factory, product.id)"
                      :key="request.factory"
                      class="mr-2"
                      @click="navigateToFactory(request.factory)"
                    >
                      <b>{{ findFactory(request.factory).name }}</b>: {{ request.amount }}/min
                    </v-chip>
                  </div>
                  <v-radio-group
                    v-model="factory.surplus[product.id].surplusHandling"
                    class="radio-fix d-inline mb-4"
                    density="compact"
                    hide-details
                    inline
                    @update:model-value="updateFactory(factory)"
                  >
                    <v-radio class="mr-4" label="Export" value="export" />
                    <v-radio label="Sink" value="sink" />
                  </v-radio-group>
                </div>
                <p v-else class="mt-2">No requests. Add imports in other factories.</p>
              </v-card-text>
            </v-card>
          </div>
        </div>
      </div>
    </div>
    <p v-else class="text-body-1">Awaiting product selection.</p>
  </div>
</template>

<script setup lang="ts">
  import {
    Factory,
    FactoryDependencyMetrics,
    FactoryDependencyRequest,
    FactoryItem,
  } from '@/interfaces/planner/FactoryInterface'

  const findFactory = inject('findFactory') as (id: number) => Factory
  const updateFactory = inject('updateFactory') as (id: number) => Factory
  const getPartDisplayName = inject('getPartDisplayName') as (part: string) => string
  const navigateToFactory = inject('navigateToFactory') as (id: number) => void

  defineProps<{
    factory: Factory;
    helpText: boolean;
  }>()

  const requestStyling = (requestMetric: FactoryDependencyMetrics) => {
    // If no requests, return nothing, this should never really happen though.
    if (Object.keys(requestMetric).length === 0) {
      return {}
    }

    return {
      border: requestMetric.isRequestSatisfied ? '2px solid rgb(97, 97, 97)' : '2px solid red !important',
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

  const getRequestMetricsForFactoryByPart = (
    factory: Factory,
    part: string
  ): FactoryDependencyMetrics => {
    // Requests may be empty.
    if (!factory || !part || !factory.id) {
      return {}
    }

    return factory.dependencies.metrics[part] ?? {}
  }

  const fixShortage = (factory: Factory, product: FactoryItem) => {
    const metric = getRequestMetricsForFactoryByPart(factory, product.id)
    const difference = Math.abs(metric.difference)
    product.amount = parseInt(product.amount) + parseInt(difference)
    updateFactory(factory)
  }
</script>

<style lang="scss" scoped>
.radio-fix {
  ::v-deep label {
    margin-left: 5px;
  }

  * {
    opacity: 100;
  }
}

.v-card-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}
</style>
