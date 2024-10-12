<template>
  <v-row>
    <v-col>
      <v-card :id="factory.id" :style="factoryStyling(factory)">
        <v-row style="padding: 16px">
          <v-col class="text-h4">
            <i class="fas fa-industry"></i>
            <input
              v-model="factory.name"
              class="w-auto ml-4"
              placeholder="Factory Name"
              @input="updateFactory(factory)"
            />
          </v-col>
          <v-col align-self="center" class="text-right">
            <v-btn
              v-show="!factory.hidden"
              color="primary"
              prepend-icon="fas fa-eye-slash"
              variant="outlined"
              @click="factory.hidden = true">Hide
            </v-btn>
            <v-btn
              v-show="factory.hidden"
              color="primary"
              prepend-icon="fas fa-eye"
              variant="outlined"
              @click="factory.hidden = false">Show
            </v-btn>
            <v-btn
              class="ml-4"
              color="red"
              prepend-icon="fas fa-trash"
              variant="outlined"
              @click="confirmDelete() && deleteFactory(factory)">Delete Factory
            </v-btn>
          </v-col>
        </v-row>
        <v-divider color="white" thickness="2px"></v-divider>
        <v-card-text v-show="!factory.hidden">
          <planner-factory-products
            :factory="factory"
            :gameData="gameData"
            :help-text="helpText"
            />
  <!--        <v-divider class="my-4" color="white" thickness="2px"></v-divider>-->
  <!--        <planner-factory-imports-->
  <!--          :factory="factory"-->
  <!--        />-->
  <!--        <v-divider class="my-4" color="white" thickness="2px"></v-divider>-->
  <!--        <planner-factory-outputs-->
  <!--          :factory="factory"-->
  <!--        />-->
  <!--        <v-divider class="my-4" color="white" thickness="2px"></v-divider>-->
  <!--        <planner-factory-satisfaction-->
  <!--          :factory="factory"-->
  <!--        />-->
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import {defineProps} from 'vue';
import {Factory, FactoryDependency} from "@/interfaces/planner/Factory";
import PlannerFactoryProducts from "@/components/planner/PlannerFactoryProducts.vue";
import PlannerFactoryImports from "@/components/planner/PlannerFactoryImports.vue";
import PlannerFactorySatisfaction from "@/components/planner/PlannerFactorySatisfaction.vue";
import {DataInterface} from "@/interfaces/DataInterface";

const components = {
  PlannerFactoryProducts,
  PlannerFactoryImports,
  PlannerFactorySatisfaction
}

const updateFactory = inject('updateFactory') as (factory: Factory) => void;
const deleteFactory = inject('deleteFactory') as (factory: Factory) => void;

const props = defineProps<{
  factory: Factory
  dependencies: FactoryDependency[]
  gameData: DataInterface
  helpText: boolean
}>();
const hidden = false;

const factoryStyling = (factory: Factory) => {
  const satisfied = factory.inputsSatisfied && areAllRequestsSatisfiedForFactory(factory);

  return {
    border: `1px solid ${satisfied ? 'rgb(108, 108, 108)' : '#dc3545'}`,
    backgroundColor: `${satisfied ? 'rgba(43, 43, 43, 0.4)' : 'rgba(140, 9, 21, 0.4)'}`,
  };
}

const areAllRequestsSatisfiedForFactory = (factory: Factory) =>  {
  const requests = props.dependencies[factory.id] ?? {}

  if (!requests || Object.keys(requests).length === 0) {
    // No requests, assume satisfied
    return true;
  }

  return Object.keys(requests.metrics).every(part => requests.metrics[part].isRequestSatisfied);
}

const confirmDelete = (message = 'Are you sure?') => {
  return confirm(message);
}



</script>
