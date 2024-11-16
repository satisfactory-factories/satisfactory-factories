<template>
  <v-row>
    <v-col>
      <v-card>
        <v-card-title>Upcoming features / known bugs</v-card-title>
        <v-card-text class="text-body-1">
          <p class="mb-2">
            Please report any bugs or feature requests to <a href="https://github.com/Maelstromeous/satisfactory-factories/issues"><i class="fab fa-github mr-1" />SF's GitHub page</a>!
          </p>
          <ul class="ml-4">
            <li><span class="text-red">Critical bug</span>: Recipes producing multiples of the same item e.g. Caterium CBs producing 7, are being regarded as producing 1 and the part demand not being ratioed correctly. Thanks to /u/walktheplank-yohoho for the report!</li>
            <li>Feat: <b>Overclocking / Somersloops</b> (WIP, omitted for Alpha release, it's a LOT of math!)</li>
            <li>Feat: <b>Quantum Converter support</b> (omitted for Alpha release), it's a surprisingly complex thing to get right...</li>
            <li>Feat: Add ability to add icon to factory.</li>
            <li>Feat: Allow ability to add duplicate products to a factory (in case you split processing of them up).</li>
            <li>Feat: Show unsatisfied demands for factories for easy creation of new factories.</li>
            <li>Feat: Add utilisation % to exports.</li>
            <li>Feat: Add internal chip next to byproducts that are used internally.</li>
            <li>Feat: Goal Maker - Configure a goal to show on the right side enable the creation of factories to meet the demand.</li>
            <li>Feat: Integrate <a href="https://help.featurebase.app/en/help/articles/1261560-install-feedback-widget">Featurebase</a>.</li>
            <li>Feat: World Resources: Make world resources flag an issue when exceeding world limits.</li>
            <li>Feat: World Resources: Show % used.</li>
            <li>Feat: Add button to jump to the node in the graph.</li>
            <li>Feat: Password resets (use a password manager people! 🔐)</li>
          </ul>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>
<script setup lang="ts">
</script>
