<template>
  <div>
    <h2 class="text-h5 mb-4"><i class="fa fa-truck-container" /> Outputs</h2>
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
        <v-card
          v-for="(surplus, part) in factory.surplus"
          :key="`${factory.id}-${part}`"
          class="border-b output"
          rounded="0"
          :style="requestStyling(getRequestMetricsForFactoryByPart(factory, part))"
        >
          <v-card-title><b>{{ getPartDisplayName(part) }}</b></v-card-title>
          <v-card-text class="text-body-1">
            <p><b>Surplus</b>: {{ surplus.amount }}/min</p>
            <div v-if="getRequestsForFactoryByProduct(factory, part).length > 0">
              <p><b>Requests total</b>: {{ getRequestMetricsForFactoryByPart(factory, part).request }}/min</p>
              <p>Status:
                <span
                  v-if="getRequestMetricsForFactoryByPart(factory, part).isRequestSatisfied"
                  style="color: green"
                ><b>Satisfied</b></span>
                <span
                  v-if="!getRequestMetricsForFactoryByPart(factory, part).isRequestSatisfied"
                  style="color: red"
                ><b>Shortage!</b></span>
              </p>
              <div class="my-4">
                <p class="text-h6"><b>Requesting factories:</b></p>
                <ul class="ml-4">
                  <li v-for="request in getRequestsForFactoryByProduct(factory, part)" :key="request.factory">
                    <b>{{ findFactory(request.factory).name }}</b>: {{ request.amount }}/min
                  </li>
                </ul>
                <segmented-bar :max-value="surplusAmount" :requests="requests" />
              </div>
            </div>
            <p v-else>There are currently no requests upon this product.</p>
            <v-radio-group
              v-model="surplus.surplusHandling"
              class="radio-fix d-inline mb-4"
              density="compact"
              hide-details
              inline
              @update:model-value="updateFactory(factory)"
            >
              <v-radio class="mr-4" label="Export" value="export" />
              <v-radio label="Sink" value="sink" />
            </v-radio-group>
          </v-card-text>
        </v-card>
      </div>
    </div>
    <p v-else class="text-body-1">Awaiting product selection.</p>
  </div>
</template>

<script setup lang="ts">
  import { Factory, FactoryDependencyMetrics, FactoryDependencyRequest } from '@/interfaces/planner/Factory'

  const findFactory = inject('findFactory') as (id: number) => Factory
  const getPartDisplayName = inject('getPartDisplayName') as (part: string) => string

  defineProps<{
    factory: Factory;
    helpText: boolean;
  }>()

  const requestStyling = (requestMetric: FactoryDependencyMetrics) => {
    // If no requests, return nothing
    if (Object.keys(requestMetric).length === 0) {
      return {}
    }

    return {
      border: requestMetric.isRequestSatisfied ? '' : '1px solid red',
      borderBottom: requestMetric.isRequestSatisfied ? '' : '1px solid red !important',
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
    const factoryIdStr = factory.id.toString() // JavaScript doing bullshit things
    const factoryRequests = factory.dependencies[factoryIdStr]?.requestedBy

    if (!factoryRequests) {
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

    // Dependency may be empty.
    if (!factory.dependencies[factory.id.toString()]) {
      return {}
    }
    return factory.dependencies[factory.id.toString()].metrics[part] ?? {}
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

.output {
  :last-child {
    border-bottom: 0;
  }
}
</style>
