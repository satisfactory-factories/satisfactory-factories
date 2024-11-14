<template>
  <v-row>
    <v-col>
      <v-card>
        <v-card-title>Todo</v-card-title>
        <v-card-text class="text-body-1">
          <ul class="ml-4">
            <li>Bug: When multiple buildings required, only first is shown, and it's showing the last? Resolves itself upon refresh.</li>
            <li>Feat: Add ability to add icon to factory</li>
            <li>Feat: Allow ability to add duplicate products to a factory (in case you split processing of them up).</li>
            <li>Feat: Show unsatisfied demands for factories for easy creation of new factories.</li>
            <li>Feat: Add utilisation % to exports.</li>
            <li>Feat: Add internal chip next to byproducts that are used internally.</li>
            <li>Feat: Goal Maker - Configure a goal to show on the side and you need to create factories to match the demand.</li>
            <li>Feat: Integrate <a href="https://help.featurebase.app/en/help/articles/1261560-install-feedback-widget">Featurebase</a>.</li>
            <li>Feat: World Resources: Make world resources flag an issue when exceeding world limits.</li>
            <li>Feat: World Resources: Show % used.</li>
            <li>Feat: Add button to jump to the node in the graph.</li>
          </ul>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>
<script setup lang="ts">
</script>
