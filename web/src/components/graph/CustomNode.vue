<!-- CustomNodeComponent.vue -->
<template>
  <div class="custom-node">
    <div class="handle handle-left" data-handle-id="left" data-handle-position="left" />
    <span>{{ data.name }}</span>
    <div class="handle handle-right" data-handle-id="right" data-handle-position="right" />
  </div>
</template>

<script setup lang="ts">
  import { defineProps } from 'vue'
  interface NodeData {
    id: string;
    name: string;
  }
  const props = defineProps<{ data: NodeData }>()
</script>

<style scoped>
.custom-node {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px;
  border: 2px solid #6c63ff;
  background: #6c63ff;
  color: #ffffff;
  border-radius: 8px;
  position: relative;
}

.handle {
  width: 10px;
  height: 10px;
  background: #ffffff;
  border-radius: 50%;
  position: absolute;
}

.handle-left {
  left: -15px;
  top: 50%;
  transform: translateY(-50%);
}

.handle-right {
  right: -15px;
  top: 50%;
  transform: translateY(-50%);
}
</style>
