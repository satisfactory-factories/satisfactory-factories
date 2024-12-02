<template>
  <v-card class="factory-card sub-card">
    <v-card-title>Notes</v-card-title>
    <v-card-text>
      <v-textarea
        v-model="factory.notes"
        auto-grow
        clearable
        :counter="charLimit"
        error-messages=""
        placeholder="Add some notes!"
        rows="1"
        :rules="[rules.length(charLimit)]"
      />
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
  import { Factory } from '@/interfaces/planner/FactoryInterface'

  const props = defineProps <{
    factory: Factory;
    helpText: boolean;
  }>()

  // Validation rule for the character limit
  const rules = {
    length: len => v => (v || '').length < len || `Max character length (${len}) reached, condense your notes pioneer!`,
  }

  const charLimit = 1000

  watch(() => props.factory.notes, () => {
    // Prevent changes going beyond the character limit
    if (props.factory.notes.length > charLimit) {
      props.factory.notes = props.factory.notes.slice(0, charLimit)
    }
  })
</script>
