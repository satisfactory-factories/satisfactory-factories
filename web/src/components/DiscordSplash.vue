<template>
  <v-dialog v-model="showSplash" max-width="1000" scrollable @click="closeSplash">
    <v-card>
      <v-card-title class="text-h4 text-center pb-0">Join the Satisfactory Factories Discord!</v-card-title>
      <v-card-subtitle class="text-center">We've just added a Discord server!</v-card-subtitle>
      <v-card-text class="text-center">
        <p class="mb-4">On this server we will be posting our site's announcements, you get to talk directly to the developers of the project (and report any issues / offer feature suggestions) and nerd out over the game Satisfactory!</p>
        <join-discord text="Join SF Discord!" />
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">

  const seenDiscordSplash = localStorage.getItem('seenDiscordSplash')
  const seenIntro = localStorage.getItem('dismissed-introduction') ?? 'false'
  // If the user has not seen the intro splash, don't show them this as there would be two splashes.

  const showSplash = ref<boolean>(seenDiscordSplash !== 'true' && seenIntro === 'true')

  // In case the user closes the dialog without clicking on the button
  watch(() => showSplash.value, value => {
    if (!value) {
      closeSplash()
    }
  })

  const closeSplash = () => {
    showSplash.value = false
    localStorage.setItem('seenDiscordSplash', 'true')
  }

</script>
