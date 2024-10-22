<template>
  <draggable v-model="factoriesCopy" class="factory-list" item-key="id" @end="onDragEnd">
    <template #item="{ element }">
      <div :key="element.id" class="mb-1 rounded" :class="factoryClass(element)">
        <v-card
          class="w-100 header list"
          @click="navigateToFactory(element.id)"
        >
          <v-card-title class="py-3">
            <v-row>
              <v-col align-self="end" class="text-body-1">
                <i class="fas fa-bars text-grey-darken-1" />
                <i class="fas fa-industry ml-2" />
                <span class="ml-2">{{ truncateFactoryName(element.name) }}</span>
              </v-col>
            </v-row>
          </v-card-title>
        </v-card>
      </div>
    </template>
  </draggable>
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
  import { defineEmits, defineProps, inject, ref, watch } from 'vue'
  import { Factory } from '@/interfaces/planner/FactoryInterface'
  import draggable from 'vuedraggable'

  const navigateToFactory = inject('navigateToFactory') as (id: number) => void

  const emit = defineEmits<{
    createFactory:() => void,
    updateFactories:(factories: Factory[]) => void
  }>()
  const props = defineProps<{ factories: Factory[], totalFactories: number }>()
  const factoriesCopy = ref([...props.factories])

  watch(() => props.factories, factories => {
    factoriesCopy.value = [...factories]
  }, { deep: true })

  const factoryClass = (factory: Factory) => {
    return {
      'factory-card': true,
      problem: factory.hasProblem,
    }
  }

  const createFactory = () => {
    emit('createFactory')
  }

  const truncateFactoryName = (name: string, limit: number = 24) => {
    return name.length > limit ? name.substring(0, limit) + '...' : name
  }

  const onDragEnd = () => {
    emit('updateFactories', factoriesCopy.value)
  }
</script>

<style lang="scss" scoped>
.factory-list {
  display: flex;
  flex-direction: column;
}
</style>
