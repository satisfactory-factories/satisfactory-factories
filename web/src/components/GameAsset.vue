<template>
  <v-img
    :alt="subject"
    aspect-ratio="1/1"
    inline
    :min-height="heightPx"
    :min-width="widthPx"
    :src="imgUrl"
  />
</template>

<script setup lang="ts">
  import { defineProps } from 'vue'
  import { useGameDataStore } from '@/stores/game-data-store'

  useGameDataStore()
  const gameData = useGameDataStore().getGameData()

  if (!gameData) {
    throw new Error('No game data provided to GameAsset!')
  }

  const props = defineProps<{
    subject: string
    height?: number | undefined
    width?: number | undefined
    type: 'building' | 'item',
  }>()

  const sluggify = (subject: string): string => {
    // Converts CamelCase to kebab-case without adding dash at the beginning
    return subject.replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/\s+/g, '-').toLowerCase()
  }

  const getIcon = (
    subject: string,
    type: 'building' | 'item',
    size: 'small' | 'big' = 'small'
  ): string => {
    if (!subject) {
      console.error('No subject provided to getIcon!')
      return ''
    }
    if (type === 'building') {
      return getImageUrl(subject, 'building', size)
    } else {
      const partItem = gameData.items.parts[subject]
      const rawItem = gameData.items.rawResources[subject]
      const item = partItem?.name || rawItem?.name || subject

      return getImageUrl(sluggify(item), 'item', size)
    }
  }

  const getImageUrl = (
    name: string,
    type: 'building' | 'item',
    size: 'small' | 'big' = 'big'
  ): string => {
    const pxSize = size === 'small' ? '64' : '256'
    return `/assets/game/images/${type}/${name}_${pxSize}.png`
  }

  const widthPx = props.width ?? 32
  const heightPx = props.height ?? 32
  const imgUrl = getIcon(props.subject, props.type, 'small')
</script>
