<template>
  <div>
    <v-toolbar class="border-t-md" dark density="compact">
      <v-tabs
        v-model="tab"
        color="deep-orange"
      >
        <v-tab
          v-for="item in items"
          :key="item.name"
          class="text-none"
          :text="item.name"
          :value="item"
        />

      </v-tabs>
      <v-btn
        icon="fas fa-plus"
        size="x-small"
      />
    </v-toolbar>

    <v-toolbar class="bg-grey-darken-2 px-2" dark density="compact">
      <template #prepend>
        <v-text-field
          v-if="isEditingName"
          density="compact"
          hide-details
          :value="tab.name"
          variant="outlined"
          width="300"
        />
        <span v-else>{{ tab.name }}</span>
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
        class="ml-2"
        color="red rounded"
        icon="fas fa-trash"
        size="small"
        variant="flat"
      />
    </v-toolbar>
  </div>

</template>

<script setup lang="ts">
  const isEditingName = ref(false)

  const items = [
    { id: 1, name: 'Default', factory: {} },
    { id: 2, name: 'factory 1', factory: {} },
  ]

  const tab = ref(items[0])
</script>
