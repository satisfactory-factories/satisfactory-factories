<template>
  <v-row>
    <v-col>
      <v-card>
        <v-card-title>Upcoming features / known bugs</v-card-title>
        <v-card-text class="text-body-1">
          <p class="mb-2">
            Please report any bugs or feature requests to <a href="https://github.com/Maelstromeous/satisfactory-factories/issues"><i class="fab fa-github mr-1" />SF's GitHub page</a> or <a href="https://www.reddit.com/r/SatisfactoryGame/comments/1gsm980/new_tool_satisfactory_factories_a_production/">Reddit post</a>!
          </p>
          <ul class="ml-4">
            <li><span class="text-amber">Critical bug</span>: <s>Recipes producing multiples of the same item e.g. Caterium CBs producing 7, are being regarded as producing 1 and the part demand not being ratioed correctly.</s> Thanks to /u/walktheplank-yohoho for the report! <span class="text-green">Fix released 14:45 UTC 16th Nov</span>, please refresh and report any further issues! <a class="text-cyan" href="https://github.com/Maelstromeous/satisfactory-factories/issues/1">Please report any broken recipes here!</a> </li>
            <li><span class="text-amber">Critical bug</span>: Certain fluid recipes are inaccurate. Quite likely related to the above. Please offer feedback!</li>
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
