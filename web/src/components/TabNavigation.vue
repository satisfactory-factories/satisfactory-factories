<template>
  <div>
    <v-toolbar class="border-t-md" dark density="compact">
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
        icon="fas fa-plus"
        size="x-small"
        @click="appStore.addTab()"
      />
    </v-toolbar>

    <v-toolbar class="bg-grey-darken-2 px-2" dark density="compact">
      <template #prepend>
        <v-text-field
          v-if="isEditingName"
          density="compact"
          hide-details
          :value="appStore.currentFactoryTab.name"
          variant="outlined"
          width="300"
        />
        <span v-else>{{ appStore.currentFactoryTab.name }}</span>
        <v-btn
          v-if="isEditingName"
          class="ml-2"
          color="green rounded"
          icon=" fas fa-check"
          size="small"
          variant="flat"
          @click="isEditingName = !isEditingName"
        />
        <v-btn
          v-else
          class="ml-2"
          color="grey-darken-2"
          icon="fas fa-pen"
          size="x-small"
          variant="flat"
          @click="isEditingName = !isEditingName"
        />
      </template>

      <ShareButton />
      <v-btn
        v-if="appStore.factoryTabs.length > 1"
        class="ml-2"
        color="red rounded"
        icon="fas fa-trash"
        size="small"
        variant="flat"
        @click="onClickRemoveTab"
      />
    </v-toolbar>
  </div>

</template>

<script setup lang="ts">
  import { useAppStore } from '@/stores/app-store'

  const appStore = useAppStore()

  const isEditingName = ref(false)

  const onClickRemoveTab = () => {
    appStore.removeTab(appStore.currentFactoryTab.id)
  }

</script>
