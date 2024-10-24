<template>
  <v-img
    class="cursor-pointer"
    max-width="200px"
    src="/assets/img/support_me_on_kofi_dark.webp"
    @click="open = true"
  />
  <v-dialog
    v-model="open"
    width="auto"
  >
    <v-card
      prepend-icon="fas fa-heart"
      title="Help support the project!"
      width="400"
    >
      <div class="pa-2">
        <iframe
          id="kofiframe"
          height="600"
          src="https://ko-fi.com/maelstromeous/?hidefeed=true&widget=true&embed=true&preview=true"
          style="border:none;width:100%;padding:4px;background:transparent;"
          title="maelstromeous"
        />
      </div>
      <template #actions>
        <v-btn
          class="ms-auto"
          text="Close"
          @click="open = false"
        />
      </template>
    </v-card>
  </v-dialog>
</template>
<script setup lang="ts">
  const open = ref(false)
</script>
