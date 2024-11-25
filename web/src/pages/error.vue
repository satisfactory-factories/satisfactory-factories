<template>
  <v-card class="rounded-md" style="border: 2px solid red">
    <v-card-title class="text-h5">Error Initializing Planner!</v-card-title>
    <v-card-text>
      <p class="mb-4">
        Unfortunately it appears that your data is somehow corrupted.
      </p>
      <p class="mb-4">
        The error is: <span class="text-red">{{ fatalityError }}</span>.
      </p>
      <p class="mb-4">
        Please press this button so your data is copied to your clipboard and you can paste it in the Discord server.
        <v-btn
          v-if="!copied"
          class="ml-2 border"
          color="primary"
          density="compact"
          @click="copyData"
        >
          <i class="fas fa-files-medical" />
          <span class="ml-2">Copy Data</span>
        </v-btn>
        <v-btn
          v-if="copied"
          class="ml-2 border"
          color="primary"
          density="compact"
          disabled
        >
          <i class="fas fa-files-medical" />
          <span class="ml-2">Copied</span>
        </v-btn>
      </p>
      <p class="mb-4">
        Please report this error and it's data on our <v-btn class="mx-1 bg-indigo-darken-2 border" density="compact" href="https://discord.gg/zge68PrGJ7" target="_blank">
          <i class="fab fa-discord" />
          <span class="ml-2">Discord</span>
        </v-btn> server. Chances are unfortunately though we cannot fix this. Please appreciate this project is still in an <b>Alpha</b> state.
      </p>
      <div class="text-center">
        <v-btn class="mr-2" color="red" @click="wipeAndReload"><i class="fas fa-trash mr-2" />Wipe factory data</v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>
<script setup lang="ts">

  import router from '@/router'

  const copied = ref(false)

  const copyData = () => {
    console.log('Copying data to clipboard')
    // We can't use appStore.getFactories here as that's likely where it's erroring. We need to pull the data out directly from localStorage.
    const data = localStorage.getItem('factoryTabs') ?? localStorage.getItem('factories')
    if (!data) {
      alert('No data to copy!!')
      return
    }

    const discordMessage = 'Hello, I have encountered an error initializing the planner. Here is the data:\n```json\n' + data + '\n```'

    navigator.clipboard.writeText(discordMessage)
    copied.value = true
  }

  const wipeAndReload = () => {
    localStorage.setItem('factoryTabs', '')
    router.push('/')
  }
</script>
