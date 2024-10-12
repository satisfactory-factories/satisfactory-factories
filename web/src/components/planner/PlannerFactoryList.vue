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
        ripple
        @click="createFactory"
      >
        Add Factory
      </v-btn>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';
import { Factory } from '@/interfaces/planner/Factory';

const props = defineProps<{ groups: Factory[] }>();
const emit = defineEmits<{ 'create-factory': () => void }>();

const groupStyling = (group: Factory) => {
  return {
    border: `1px solid ${group.inputsSatisfied ? 'rgb(108, 108, 108)' : '#dc3545'}`,
    backgroundColor: `${group.inputsSatisfied ? 'rgba(43, 43, 43, 0.4)' : 'rgba(140, 9, 21, 0.4)'}`,
  };
};

const navigateToFactory = (factoryId: string) => {
  const factoryElement = document.getElementById(`${factoryId}`);
  if (factoryElement) {
    factoryElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

const createFactory = () => {
  emit('create-factory');
};
</script>

<style lang="scss" scoped>
v-list-item {
  margin-bottom: 10px;
  :last-child {
    margin-bottom: 0;
  }
}
</style>
