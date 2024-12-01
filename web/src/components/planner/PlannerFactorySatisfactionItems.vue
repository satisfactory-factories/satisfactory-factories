<template>
  <v-card class="border-md sub-card">
    <v-card-title>
      <h2 class="text-h6">
        <i class="fas fa-cube" /><span class="ml-2">Items</span>
      </h2>
    </v-card-title>
    <v-card-text class="text-body-1 pb-2 px-0">
      <v-row v-for="(part, partId) in factory.parts" :key="partId" class="border-b-md mx-0">
        <v-col
          class="pa-0 align-content-center"
          cols="12"
        >
          <planner-factory-satisfaction-item-row
            :factory="factory"
            :part="part"
            :part-id="partId.toString()"
          />
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>
<script setup lang="ts">
  import PlannerFactorySatisfactionItemRow from '@/components/planner/PlannerFactorySatisfactionItemRow.vue'
  import { Factory } from '@/interfaces/planner/FactoryInterface'

  const props = defineProps<{
    factory: Factory;
  }>()

</script>
