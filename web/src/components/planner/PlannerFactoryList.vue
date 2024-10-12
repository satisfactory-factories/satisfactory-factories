<template>
  <v-list class="mt-4" density="compact" v-if="groups.length > 0">
    <v-list-item v-for="(group, index) in groups" :key="group.id">
      <v-card :style="groupStyling(group)" class="w-100" @click="navigateToFactory(group.id)">
        <v-card-title>
          <i class="fas fa-industry"></i>
          <span class="ml-2">{{ group.name }}</span>
        </v-card-title>
      </v-card>
    </v-list-item>
  </v-list>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

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
