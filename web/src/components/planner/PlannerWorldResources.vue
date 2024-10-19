<template>
  <v-row>
    <v-col>
      <v-card>
        <v-row style="padding: 16px">
          <v-col class="text-h4">
            <i class="fas fa-globe" /><span class="ml-3">World Resources</span>
          </v-col>
          <v-col align-self="center" class="text-right">
            <v-btn
              v-show="!hidden"
              color="primary"
              prepend-icon="fas fa-eye-slash"
              variant="outlined"
              @click="toggleVisibility"
            >Hide
            </v-btn>
            <v-btn
              v-show="hidden"
              color="primary"
              prepend-icon="fas fa-eye"
              variant="outlined"
              @click="toggleVisibility"
            >Show
            </v-btn>
          </v-col>
        </v-row>
        <v-card-text v-show="!hidden" class="text-body-1">
          <p class="mb-4">Showing all of the world resources remaining after all factory requirements are taken into account. Units are in /min or /m3 depending on the resource. This does not take into any account about Converters as it's very hard to calculate.</p>
          <v-chip v-for="ore in worldRawResources" :key="ore.id" class="ma-1" color="primary">
            <game-asset :subject="ore.id" type="item" />
            <span v-if="ore.name !== 'Water'" class="ml-2">{{ ore.name }}: {{ ore.amount }}</span>
            <span v-else class="ml-2">Water: <i class="fas fa-infinity" /></span>
          </v-chip>
        </v-card-text>

      </v-card>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
  import { ref, watch } from 'vue'
  import { WorldRawResource } from '@/interfaces/planner/FactoryInterface'

  defineProps<{
    worldRawResources: WorldRawResource;
  }>()

  // Initialize the 'hidden' ref based on the value in localStorage
  const hidden = ref<boolean>(localStorage.getItem('worldResourcesHidden') === 'true')

  // Watch the 'hidden' ref and update localStorage whenever it changes
  watch(hidden, newValue => {
    localStorage.setItem('worldResourcesHidden', newValue.toString())
  })

  // Function to toggle visibility
  const toggleVisibility = () => {
    hidden.value = !hidden.value
  }
</script>
