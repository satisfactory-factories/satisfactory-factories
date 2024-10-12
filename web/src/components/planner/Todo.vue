<template>
   <v-row>
    <v-col>
      <v-card>
        <v-card-title>Todo</v-card-title>
        <v-card-text>
          <v-list density="compact">
            <v-list-item>Bug: Delete group deletes wrong factories!</v-list-item>
            <v-list-item>Bug: When a group is deleted, the dependants are not properly updated. Need to check if
              inputs are still valid and if not delete them.
            </v-list-item>
            <v-list-item>Feat: If user attempts to set an output which has dependants to sink, warn the user
              first because it's potentially destructive as we remove the invalid inputs.
            </v-list-item>
            <v-list-item>Feat: Complete request bar segments.</v-list-item>
            <v-list-item>Feat: Enable to sink remainder, or sink entire output.</v-list-item>
          </v-list>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>
<script setup lang="ts">
</script>
