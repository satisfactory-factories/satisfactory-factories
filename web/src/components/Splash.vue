<template>
  <v-dialog v-model="showSplash" max-width="1000" scrollable @click="closeSplash">
    <v-card>
      <v-card-title class="text-h4 text-center pb-0">New Feature: Game Sync</v-card-title>
      <!--      <v-card-subtitle class="text-center">We've just added a Discord server!</v-card-subtitle>-->
      <v-card-text class="text-center">
        <p class="mb-4">We've added a new feature called Game Sync. This enables you to understand <b>when to take action</b> in game in order to implement the plan.</p>
        <p class="mb-4">Check out the video below for a quick overview of the feature!</p>
        <v-responsive :aspect-ratio="16 / 9" class="pb-4">
          <iframe
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen
            frameborder="0"
            height="100%"
            referrerpolicy="strict-origin-when-cross-origin"
            src="https://www.youtube.com/embed/ueVxtBzIGHY?si=Ce3D74H2kayAWkFG"
            title="YouTube video player"
            width="100%"
          />
        </v-responsive>
      </v-card-text>
      <v-card-actions>
        <v-btn color="primary" variant="elevated" @click="closeSplash">
          <i class="fas fa-check" /><span class="ml-2">Got it!</span>
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
  const key = 'seenGameSyncSplash'
  const seenSplash = localStorage.getItem(key)
  const seenIntro = localStorage.getItem('dismissed-introduction') ?? 'false'
  // If the user has not seen the intro splash, don't show them this as there would be two splashes.

  const showSplash = ref<boolean>(seenSplash !== 'true' && seenIntro === 'true')

  // In case the user closes the dialog without clicking on the button
  watch(() => showSplash.value, value => {
    if (!value) {
      closeSplash()
    }
  })

  const closeSplash = () => {
    showSplash.value = false
    localStorage.setItem(key, 'true')
  }

</script>
