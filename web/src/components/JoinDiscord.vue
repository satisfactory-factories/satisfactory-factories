<template>
  <v-btn class="ml-2 bg-indigo-darken-2 border" href="https://discord.gg/zge68PrGJ7" target="_blank"><i class="fab fa-discord" /><span class="ml-2">{{ showText }}</span></v-btn>
</template>

<script setup lang="ts">
  // Property to change text

  const props = defineProps<{
    text?: string
  }>()

  const showText = props.text ?? 'Discord'
</script>
