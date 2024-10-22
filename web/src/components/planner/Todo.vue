<template>
  <v-row>
    <v-col>
      <v-card>
        <v-card-title>Todo</v-card-title>
        <v-card-text class="text-body-1">
          <ul class="ml-4">
            <li>Feat: Take another look at dependency management. Ensure when deleting a factory the dependencies are updated.</li>
            <li>Bug: Products: Should not be able to select multiple products of the same recipe.</li>
            <li>Bug: Imports: Should not be able to select the same factory and part for import.</li>
            <li>Feat: Complete request bar segments.</li>
            <li>Feat: Enable to sink remainder, or sink entire output.</li>
            <li>Feat: Byproduct representations</li>
            <li>Bug: Fix Residual Plastic naming to Plastic.</li>
            <li>Bug: Fix Residual Plastic not detecting Polymer Resin as it's requirement (data issue?).</li>
            <li>Feat: Show unsatisfied demands for factories for easy creation of new factories.</li>
          </ul>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>
<script setup lang="ts">
</script>
