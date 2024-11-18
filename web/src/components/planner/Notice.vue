<template>
  <v-row>
    <v-col>
      <v-card>
        <v-card-title><h1 class="text-h5">Upcoming features / known bugs</h1></v-card-title>
        <v-card-text class="text-body-1">
          <p class="mb-2">
            Please report any bugs or feature requests to <a class="font-weight-bold text-blue" href="https://github.com/Maelstromeous/satisfactory-factories/issues"><i class="fab fa-github mr-1" />SF's GitHub issues</a> or <a class="text-blue" href="https://www.reddit.com/r/SatisfactoryGame/comments/1gsm980/new_tool_satisfactory_factories_a_production/">Reddit post</a>!
          </p>
          <ul class="ml-4">
            <li><span class="text-red">BUG:</span> Quantum Encoder has no power values.</li>
            <li><span class="text-red">BUG:</span> Imports are not showing up for collapsed / hidden factories.</li>
            <li><span class="text-red">BUG:</span> Missing internal chip next to byproducts that are used internally.</li>
            <li>Feature: <b>Overclocking / Somersloops</b> (WIP, omitted for Alpha release, it's a LOT of math!)</li>
            <li>Feature: <b>Quantum Converter support</b> (omitted for Alpha release), it's a surprisingly complex thing to get right...</li>
            <li>Feature: Add ability to add icon to factory.</li>
            <li>Feature: Show unsatisfied demands for factories for easy creation of new factories.</li>
            <li>Feature: Add utilisation % to exports.</li>
            <li>Feature: Goal Maker - Configure a goal to show on the right side enable the creation of factories to meet the demand.</li>
            <li>Feature: World Resources: Make world resources flag an issue when exceeding world limits.</li>
            <li>Feature: World Resources: Show % used.</li>
            <li>Feature: Add button to jump to the node in the graph.</li>
            <li>Feature: Password resets (use a password manager people! 🔐)</li>
            <li><span class="text-green">FIXED 14:45 UTC Nov 16th:</span> BUG: Products where recipes created multiple items multiplied ingredients by the number of products per recipe cycle.</li>
            <li><span class="text-green">FIXED 14:52 UTC Nov 18th:</span> BUG: Multiple products of the same item using different recipes will only be counted once (the last entry).</li>
            <li><span class="text-green">ADDED 14:52 UTC Nov 18th:</span> Feature: Allow ability to add duplicate products to a factory (in case you split processing of them up).</li>

          </ul>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>
<script setup lang="ts">
</script>
