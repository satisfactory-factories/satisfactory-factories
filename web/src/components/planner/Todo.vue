<template>
  <v-row>
    <v-col>
      <v-card>
        <v-card-title>Todo</v-card-title>
        <v-card-text class="text-body-1">
          <ul class="ml-4">
            <li>TEST ALL THE THINGS!!!</li>
            <li>Bug: When a factory is deleted, the dependants are not properly updated. Need to check if inputs are still valid and if not delete them.
            </li>
            <li>Bug: When all factories are cleared, dependencies are not cleared.</li>
            <li>Feat: If user attempts to set an output which has dependants to sink, warn the user
              first because it's potentially destructive as we remove the invalid inputs.
            </li>
            <li>Bug: Products: Should not be able to select multiple products of the same name.</li>
            <li>Feat: Complete request bar segments.</li>
            <li>Feat: Enable to sink remainder, or sink entire output.</li>
          </ul>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>
<script setup lang="ts">
</script>
