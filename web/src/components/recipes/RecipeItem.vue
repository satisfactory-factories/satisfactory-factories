<template>
  <div>
    <div class="mb-2 border-b-md">
      <span class="font-weight-bold mr-2">Inputs:</span>
      <v-chip
        v-for="ingredient in recipe.ingredients"
        :key="ingredient.part"
        class="sf-chip"
      >
        <game-asset
          :subject="ingredient.part"
          type="item"
        />
        <span class="ml-2">
          <b>{{ getPartDisplayName(ingredient.part) }}:</b> x{{ ingredient.amount }}
        </span>
      </v-chip>
    </div>
    <div>
      <span class="font-weight-bold mr-2">Products:</span>
      <v-chip
        v-for="product in recipe.products"
        :key="product.part"
        class="sf-chip"
      >
        <game-asset
          :subject="product.part"
          type="item"
        />
        <span class="ml-2">
          <b>{{ getPartDisplayName(product.part) }}:</b> x{{ product.amount }}
        </span>
      </v-chip>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { Recipe } from '@/interfaces/Recipe'
  import { getPartDisplayName } from '@/utils/helpers'

  defineProps<{
    recipe: Recipe;
  }>()
</script>
