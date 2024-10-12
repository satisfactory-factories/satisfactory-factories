<template>
  <v-row>
    <v-col>
      <v-card>
        <v-row style="padding: 16px">
          <v-col class="text-h4">
            <i class="fas fa-globe"></i> World Resources
          </v-col>
          <v-col align-self="center" class="text-right">
            <v-btn v-show="!hidden" color="primary" prepend-icon="fas fa-eye-slash" variant="outlined"
                   @click="toggleVisibility">Hide
            </v-btn>
            <v-btn v-show="hidden" color="primary" prepend-icon="fas fa-eye" variant="outlined"
                   @click="toggleVisibility">Show
            </v-btn>
          </v-col>
        </v-row>
        <v-card-text v-show="!hidden" class="text-body-1">
          <p class="mb-4">Showing all of the world resources remaining after all factory requirements are taken into account. Units are in /min or /m3 depending on the resource. This does not take into any account about Converters as it's very hard to calculate.</p>
          <ul class="pl-4">
            <li v-for="ore in worldRawResources" :key="ore.name">
              <b>{{ ore.name }}</b>: {{ ore.amount }}
            </li>
          </ul>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { WorldRawResource } from "@/interfaces/planner/Group";

const props = defineProps<{
  worldRawResources: WorldRawResource;
}>();

// Initialize the 'hidden' ref based on the value in localStorage
let hidden = ref<boolean>(localStorage.getItem('worldResourcesHidden') === 'true');

// Watch the 'hidden' ref and update localStorage whenever it changes
watch(hidden, (newValue) => {
  localStorage.setItem('worldResourcesHidden', newValue.toString());
});

// Function to toggle visibility
const toggleVisibility = () => {
  hidden.value = !hidden.value;
};
</script>
