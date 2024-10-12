<template>
  <v-row>
    <v-col>
      <v-list density="compact" v-if="groups.length > 0">
        <v-list-item v-for="(group) in groups" :key="group.id">
          <v-card :style="groupStyling(group)" class="w-100" @click="navigateToFactory(group.id)">
            <v-card-title>
              <i class="fas fa-industry"></i>
              <span class="ml-2">{{ group.name }}</span>
            </v-card-title>
          </v-card>
        </v-list-item>
      </v-list>
    </v-col>
  </v-row>
  <v-row class="pa-0 ma-0">
    <v-col class="text-center">
      <v-btn
        color="primary"
        prepend-icon="fas fa-plus"
        ripple @click="
        $emit('create-group')">
          Add Factory
      </v-btn>
    </v-col>
  </v-row>

</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import {Group} from "@/interfaces/planner/Group";

interface Product {
  id: string;
  recipe: string;
  amount: number;
}

export default defineComponent({
  name: 'PlannerFactoryList',
  props: {
    groups: {
      type: Array as PropType<Group[]>,
      required: true,
    },
  },
  methods: {
    groupStyling(group: Group) {
      return {
        border: `1px solid ${group.inputsSatisfied ? 'rgb(108, 108, 108)' : '#dc3545'}`,
        backgroundColor: `${group.inputsSatisfied ? 'rgba(43, 43, 43, 0.4)' : 'rgba(140, 9, 21, 0.4)'}`,
      };
    },
    navigateToFactory(factoryId) {
      const factoryElement = document.getElementById(`${factoryId}`);
      if (factoryElement) {
        factoryElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },
  },
});
</script>

<style scss scoped>
v-list-item {
  margin-bottom: 10px;
  :last-child {
    margin-bottom: 0;
  }
}
</style>
