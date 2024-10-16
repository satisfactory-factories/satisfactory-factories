<template>
  <v-img
    :alt="subject"
    aspect-ratio="1/1"
    :height="heightPx"
    inline
    :src="imgUrl"
    :width="widthPx"
  />
</template>

<script setup lang="ts">
  import { defineProps } from 'vue'

  const getIcon = inject('getIcon') as (item: string) => string

  const props = defineProps<{
    subject: string
    height?: number | undefined
    width?: number | undefined
    type: string
  }>()

  const widthPx = props.width ?? 32
  const heightPx = props.height ?? 32

  const imgUrl = getIcon(props.subject, props.type, 'small')
</script>
