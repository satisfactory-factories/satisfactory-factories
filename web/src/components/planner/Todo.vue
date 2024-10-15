<template>
  <v-row>
    <v-col>
      <v-card>
        <v-card-title>Todo</v-card-title>
        <v-card-text class="text-body-1">
          <ul class="ml-4">
            <li>TEST ALL THE THINGS!!!</li>
            <li>Feat: Take another look at dependency management. Ensure when deleting a factory the dependencies are updated.</li>
            <li>Bug: Products: Should not be able to select multiple products of the same recipe.</li>
            <li>Bug: Imports: Should not be able to select the same factory and part for import.</li>
            <li>Feat: Complete request bar segments.</li>
            <li>Feat: Enable to sink remainder, or sink entire output.</li>
            <li>Bug: Dependencies. If Factory 2 updates it's import amount and factory 1 can no longer supply it, a shortage is detected but a problem is not.</li>
          </ul>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>
<script setup lang="ts">
</script>
