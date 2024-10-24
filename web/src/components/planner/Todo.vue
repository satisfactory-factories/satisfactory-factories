<template>
  <v-row>
    <v-col>
      <v-card>
        <v-card-title>Todo</v-card-title>
        <v-card-text class="text-body-1">
          <ul class="ml-4">
            <li>Bug: Imports: Should not be able to press Satisfy until both Factory and Item are inserted.</li>
            <li>Bug: Imports: Should not be able to add a quantity until both Factory and Item are inserted.</li>
            <li>Bug: Imports: Factory list is showing up as 0 on first load, needs to show first entry.</li>
            <li>Bug: Exports: When adding a dependency, the export calculator does not show until refresh.</li>
            <li>Feat: Add ability to add icon to factory</li>
            <li>Feat: Show unsatisfied demands for factories for easy creation of new factories.</li>
            <li>Feat: Add utilisation % to exports</li>
            <li>Feat: Graph view</li>
          </ul>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>
<script setup lang="ts">
</script>
