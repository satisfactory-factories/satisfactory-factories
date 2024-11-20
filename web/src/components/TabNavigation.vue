<template>
  <div>
    <div class="border-t-md d-flex bg-grey-darken-3 align-center" density="compact">
      <v-tabs
        v-model="appStore.currentFactoryTabIndex"
        color="deep-orange"
      >
        <v-tab
          v-for="(item, index) in appStore.factoryTabs"
          :key="item.name"
          class="text-none"
          :text="item.name"
          :value="index"
        />

      </v-tabs>
      <v-btn
        color="grey-darken-3"
        icon="fas fa-plus"
        size="x-small"
        variant="flat"
        @click="appStore.addTab()"
      />
    </div>

    <div class="bg-grey-darken-2 py-1 px-2 d-flex align-center justify-space-between" dark density="compact">
      <input
        v-model.lazy="appStore.currentFactoryTab.name"
        class="pa-1 rounded tab-name"
        @keyup.enter="onEnterTabName"
      >

      <div class="d-flex align-center h-100 ga-2">
        <ShareButton />
        <v-btn
          v-if="appStore.factoryTabs.length > 1"
          color="red rounded"
          icon="fas fa-trash"
          size="small"
          variant="flat"
          @click="appStore.removeCurrentTab()"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useAppStore } from '@/stores/app-store'

  const appStore = useAppStore()

  const onEnterTabName = (event: KeyboardEvent) => {
    (event.target as HTMLInputElement).blur()
  }
</script>

<style lang="scss" scoped>
.tab-name {
  transition: background-color 0.3s;

  &:hover {
    cursor: pointer;
    background-color: #535353;
  }
}
</style>
