<template>
  <v-snackbar v-model="showToast" :color="toastType" top>
    <span v-html="toastMessage" />
  </v-snackbar>
</template>

<script setup lang="ts">
  import eventBus from '@/utils/eventBus'

  export interface ToastData {
    message: string
    type?: 'success' | 'warning' | 'error'
  }

  const showToast = ref(false)
  const toastType = ref('success')
  const toastMessage = ref('')

  const showToastMessage = (data: ToastData) => {
    if (data.type === 'error') {
      toastType.value = 'red'
    } else if (data.type === 'warning') {
      toastType.value = 'amber'
    } else {
      toastType.value = 'success'
    }
    toastMessage.value = data.message
    showToast.value = true
  }

  eventBus.on('toast', showToastMessage)

</script>
