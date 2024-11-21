<template>
  <v-btn
    class="ml-1"
    prepend-icon="fas fa-files-medical"
    @click="dialog = true"
  >Templates</v-btn>
  <v-dialog v-model="dialog" max-width="800">
    <v-card>
      <v-card-title class="headline">
        Load a template plan
      </v-card-title>
      <v-card-text>
        <p class="mb-4">
          Clicking on a button below will load a template plan into the planner. This will overwrite any existing plan.
        </p>
        <div
          v-for="template in templates"
          :key="template.name"
          class="mb-2 pb-2 border-b d-flex align-center"
        >
          <v-btn
            class="mr-2"
            color="primary"
            @click="loadTemplate(template)"
          >
            {{ template.name }}
          </v-btn>
          {{ template.description }}
        </div>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn color="blue darken-1" @click="dialog = false">
          Close
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog></template>
<script lang="ts" setup>
  import { createDemo } from '@/utils/factory-setups/demo'
  import { createSimple } from '@/utils/factory-setups/simple'
  import { useAppStore } from '@/stores/app-store'
  import { Factory } from '@/interfaces/planner/FactoryInterface'

  const appStore = useAppStore()

  const dialog = ref(false)

  interface Template {
    name: string
    description: string
    data: Factory[]
  }

  const templates = [
    {
      name: 'Demo',
      description: 'The demo template containing 6 factories with a mix of fluids, solids and multiple dependencies.',
      data: createDemo().getFactories(),
    },
    {
      name: 'Simple',
      description: 'Very simple Iron Ingot and Iron Plate factory setup, with a single dependency link.',
      data: createSimple().getFactories(),
    },
  ]

  const loadTemplate = (template: Template) => {
    console.log('Loading template', template)
    appStore.setFactories(template.data)
    dialog.value = false
  }

</script>
