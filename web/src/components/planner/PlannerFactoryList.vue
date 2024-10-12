<template>
  <v-container>
    <v-list>
      <v-list-item v-for="(group, index) in groups" :key="group.id">
        <v-card :style="groupStyling(group)" class="w-100">
          <v-card-title>
            <i class="fas fa-industry"></i>
            <span class="ml-2">{{ group.name }}</span>
          </v-card-title>
          <v-card-text>
            <p class="text-body-2">
              Products: {{ group.products.length }}<br />
              Satisfaction: <i :class="group.inputsSatisfied ? 'fas fa-check text-success' : 'fas fa-times text-danger'" />
            </p>
          </v-card-text>
        </v-card>
      </v-list-item>
    </v-list>
  </v-container>
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
  },
});
</script>

<style scoped>
.v-list-item {
  margin-bottom: 10px;
}
</style>
