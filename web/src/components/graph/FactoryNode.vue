<script setup lang="ts">
  import type { NodeProps } from '@vue-flow/core'
  import { Handle } from '@vue-flow/core'
  import { CustomData } from '@/utils/graphUtils'

  // props were passed from the slot using `v-bind="customNodeProps"`
  const props = defineProps<NodeProps<CustomData>>()

</script>

<template>
  <div class="node">
    <Handle class="handle handle-source" :position="props.targetPosition" type="target" />
    <v-card>
      <v-card-title class="border-b-md">
        <h1 class="text-h5">
          <i class="fas fa-industry" /><span class="ml-2">{{ data.factory.name }}</span>
        </h1>
      </v-card-title>
      <v-card-text>
        <v-row v-if="Object.keys(data.factory.inputs).length > 0">
          <v-col>
            <p class="text-h6">
              Importing:
            </p>
            <v-list>
              <v-list-item
                v-for="input in data.factory.inputs"
                :key="input.outputPart"
              >
                {{ input.outputPart }}
              </v-list-item>
            </v-list>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
    <Handle class="handle handle-target" :position="props.sourcePosition" type="source" />
  </div>
</template>

<style lang="scss" scoped>

.node {
  position: relative;
  min-width: 300px;
  background: dimgray;
  color: white;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-shadow: 0 0 0 1px dimgray;
}

.handle {
  width: 6px;
  height: 18px;
  border-radius: 2px;
}

.handle-source {
  background-color: green;
}

.handle-target {
  background-color: red;
}

</style>
