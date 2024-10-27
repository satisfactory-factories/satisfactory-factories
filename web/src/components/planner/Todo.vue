<template>
  <v-row>
    <v-col>
      <v-card>
        <v-card-title>Todo</v-card-title>
        <v-card-text class="text-body-1">
          <ul class="ml-4">
            <li>Bug: Byproducts are being listed incorrectly as unsupplied e.g. fuel -> HOR showing up as unsatisfied</li>
            <li>Bug: Surplus byproducts are not being shown as an export.</li>
            <li>Feat: Graph view</li>
            <li>Feat: Add ability to add icon to factory</li>
            <li>Feat: Show unsatisfied demands for factories for easy creation of new factories.</li>
            <li>Feat: Add utilisation % to exports</li>
            <li>Feat: Integrate <a href="https://help.featurebase.app/en/help/articles/1261560-install-feedback-widget">Featurebase</a></li>
          </ul>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>
<script setup lang="ts">
</script>
