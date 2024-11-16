<template>
  <v-row>
    <v-col>
      <v-card>
        <v-card-title><h1 class="text-h5">Upcoming features / known bugs</h1></v-card-title>
        <v-card-text class="text-body-1">
          <p class="mb-2">
            Please report any bugs or feature requests to <a class="font-weight-bold text-blue" href="https://github.com/Maelstromeous/satisfactory-factories/issues"><i class="fab fa-github mr-1" />SF's GitHub page</a> or <a class="text-blue" href="https://www.reddit.com/r/SatisfactoryGame/comments/1gsm980/new_tool_satisfactory_factories_a_production/">Reddit post</a>!
          </p>
          <ul class="ml-4">
            <li><span class="text-red font-weight-bold">Major Bug:</span> Multiple products of the same item using different recipes will only be counted once (the last entry).</li>
            <li><span class="text-red">Bug:</span> Quantum Encoder has no power values.</li>
            <li><span class="text-red">Bug:</span> Imports are not showing up for collapsed / hidden factories.</li>
            <li><span class="text-red">Bug:</span> Missing internal chip next to byproducts that are used internally.</li>
            <li>Feat: <b>Overclocking / Somersloops</b> (WIP, omitted for Alpha release, it's a LOT of math!)</li>
            <li>Feat: <b>Quantum Converter support</b> (omitted for Alpha release), it's a surprisingly complex thing to get right...</li>
            <li>Bug: Imports are not showing up for collapsed / hidden factories.</li>
            <li>Bug: Missing internal chip next to byproducts that are used internally.</li>
            <li>Feat: Add ability to add icon to factory.</li>
            <li>Feat: Allow ability to add duplicate products to a factory (in case you split processing of them up).</li>
            <li>Feat: Show unsatisfied demands for factories for easy creation of new factories.</li>
            <li>Feat: Add utilisation % to exports.</li>
            <li>Feat: Goal Maker - Configure a goal to show on the right side enable the creation of factories to meet the demand.</li>
            <li>Feat: Integrate <a href="https://help.featurebase.app/en/help/articles/1261560-install-feedback-widget">Featurebase</a>.</li>
            <li>Feat: World Resources: Make world resources flag an issue when exceeding world limits.</li>
            <li>Feat: World Resources: Show % used.</li>
            <li>Feat: Add button to jump to the node in the graph.</li>
            <li>Feat: Password resets (use a password manager people! 🔐)</li>
            <li><span class="text-green">FIXED 14:45 UTC Nov 16th - Critical bug</span>: Products where recipes created multiple items multiplied ingredients by the number of products per recipe cycle.</li>
          </ul>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>
<script setup lang="ts">
</script>
