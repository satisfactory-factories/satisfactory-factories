<template>
  <div>
  <h2 class="text-h5 mb-4"><i class="fa fa-truck-container"/> Outputs</h2>
    <div v-if="group.products.length > 0">
      <p v-show="helpText" class="text-body-2 mb-4">
        <i class="fas fa-info-circle"/> Items listed below are the surplus of products available for
        export. They can be exported to other factories or sunk. To set up an export, create a new factory
        and use this factory as an import.
      </p>
      <p v-if="group.surplus && Object.keys(group.surplus).length === 0" class="text-body-1">No surplus
        products yet. Add a product!</p>

      <div v-if="group.surplus && Object.keys(group.surplus).length > 0">
        <v-card
          v-for="(surplusAmount, part) in group.surplus"
          :key="`${group.id}-${part}`"
          :style="requestStyling(getRequestMetricsForGroupByPart(group, part))"
          class="border-b"
          rounded="0">
          <v-card-title><b>{{ getPartDisplayName(part) }}</b></v-card-title>
          <v-card-text class="text-body-1">

            <p><b>Surplus</b>: {{ surplusAmount }}/min</p>
            <div v-if="getRequestsForGroupByProduct(group, part).length > 0">
              <p><b>Requests total</b>: {{ getRequestMetricsForGroupByPart(group, part).request }}/min</p>
              <p>Status:
                <span v-if="getRequestMetricsForGroupByPart(group, part).isRequestSatisfied"
                      style="color: green"><b>Satisfied</b></span>
                <span v-if="!getRequestMetricsForGroupByPart(group, part).isRequestSatisfied"
                      style="color: red"><b>Shortage!</b></span>
              </p>
              <div class="my-4">
                <p class="text-h6"><b>Requesting factories:</b></p>
                <ul class="ml-4">
                  <li v-for="request in getRequestsForGroupByProduct(group, part)" :key="request.factory">
                    <b>{{ findFactory(request.group).name }}</b>: {{ request.amount }}/min
                  </li>
                </ul>
                <segmented-bar :max-value="surplusAmount" :requests="requests"/>
              </div>
            </div>
            <p v-else>There are currently no requests upon this product.</p>
            <v-radio-group
              v-model="group.surplusHandling[part]"
              class="radio-fix d-inline mb-4"
              density="compact"
              hide-details
              inline
              @update:modelValue="updateFactory(group)"
            >
              <v-radio class="mr-4" label="Export" value="export"></v-radio>
              <v-radio label="Sink" value="sink"></v-radio>
            </v-radio-group>
          </v-card-text>
        </v-card>
      </div>
    </div>
    <p v-else class="text-body-1">Awaiting product selection.</p>
  </div>
</template>

<script setup lang="ts">
import {Factory} from "@/interfaces/planner/Factory";

const findFactory = inject('findFactory') as (id: number) => Factory;

const props = defineProps<{
  group: Factory;
}>();

const requestStyling = (requestMetric: GroupDependencyRequestMetrics) => {
  // If no requests, return nothing
  if (Object.keys(requestMetric).length === 0) {
    return {};
  }

  return {
    border: requestMetric.isRequestSatisfied ? '' : '1px solid red',
    borderBottom: requestMetric.isRequestSatisfied ? '' : '1px solid red !important',
  }
}

const getRequestsForGroupByProduct = (factory: Factory | string, part: string): GroupDependencyRequest[] => {
  // If sent an empty group, there's no request.
  if (!factory) {
    return [];
  }
  // Return an object containing the requests of all factories requesting a particular part
  // We need to get all requests set upon by other factories and check their part names
  // If the part name matches the one we're looking for, we add it to the list.
  const factoryIdStr = factory.id.toString() // JavaScript doing bullshit things
  const factoryRequests = this.dependencies[factoryIdStr]?.requestedBy;

  if (!factoryRequests) {
    return []
  }

  // Create a new object returning the requests for the specific part, injecting the group ID.
  // They can only ever request one part from us, so return it as a flat array.
  return Object.entries(factoryRequests).map(([groupId, requests]) => {
    return requests.filter(request => request.part === part).map(request => {
      return {
        ...request,
        group: groupId,
      };
    });
  }).flat();
}
const getRequestMetricsForGroupByPart = (group: Factory, part: string): GroupDependencyRequestMetrics => {
  // Requests may be empty.
  if (!group || !part || !group.id) {
    return {};
  }

  // Dependency may be empty.
  if (!this.dependencies[group.id.toString()]) {
    return {};
  }
  return this.dependencies[group.id.toString()].metrics[part] ?? {};
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
</style>
