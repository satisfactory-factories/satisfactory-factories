<template>
  <div class="progress-bar">
    <div
      v-for="(request, index) in requests"
      :key="index"
      class="progress-segment"
      :style="{ width: `${(request.amount / maxValue) * 100}%`, backgroundColor: request.color || colors[index] }"
      @mouseover="showTooltip($event, request)"
      @mouseleave="hideTooltip"
    >
    </div>
    <!-- Segment for remaining capacity -->
    <div
      v-if="remaining > 0"
      class="progress-segment remaining"
      :style="{ width: `${(remaining / maxValue) * 100}%` }"
      @mouseover="showTooltip($event, { factory: 'Remaining', amount: remaining })"
      @mouseleave="hideTooltip"
    ></div>
    <div v-if="tooltip.visible" class="tooltip" :style="{ top: tooltip.top, left: tooltip.left }">
      {{ tooltip.text }}
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'SegmentedBar',
  props: {
    maxValue: {
      type: Number,
      required: true,
    },
    requests: {
      type: Array as () => { factory: string; amount: number; color?: string }[],
      required: true,
    },
  },
  data() {
    return {
      tooltip: {
        visible: false,
        text: '',
        top: '0px',
        left: '0px',
      },
      colors: this.generateRandomColors(this.requests.length),
    };
  },
  computed: {
    remaining() {
      if (!this.requests) {
        return 0;
      }
      const totalRequested = this.requests.reduce((sum, request) => sum + request.amount, 0);
      return Math.max(this.maxValue - totalRequested, 0);
    },
  },
  methods: {
    generateRandomColors(amount) {
      const colors = [];
      for (let i = 0; i < amount; i++) {
        colors.push(this.getRandomColor());
      }
      return colors;
    },
    getRandomColor() {
      const letters = '0123456789ABCDEF';
      let color = '#';
      for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
      }
      return color;
    },
    showTooltip(event: MouseEvent, request: { factory: string; amount: number }) {
      this.tooltip.visible = true;
      this.tooltip.text = `${request.factory}: ${request.amount}`;
      this.tooltip.top = `${event.clientY + 10}px`;
      this.tooltip.left = `${event.clientX + 10}px`;
    },
    hideTooltip() {
      this.tooltip.visible = false;
    },
  },
});
</script>

<style scoped>
.progress-bar {
  display: flex;
  height: 10px;
  width: 100%;
  background-color: #f1f1f1;
  position: relative;
  border-radius: 10px; /* This rounds the overall container */
  overflow: hidden; /* Ensures that the segments don't overflow the rounded corners */
}

.progress-segment {
  height: 100%;
  cursor: pointer;
  transition: all 0.3s ease-in-out;
}

/* Apply border-radius only to the first and last progress-segment */
.progress-segment:first-child {
  border-top-left-radius: 10px;
  border-bottom-left-radius: 10px;
}

.progress-segment:last-child {
  border-top-right-radius: 10px;
  border-bottom-right-radius: 10px;
}

.remaining {
  background-color: #ccc;
}

.tooltip {
  position: fixed;
  background-color: #333;
  color: white;
  padding: 5px;
  border-radius: 5px;
  font-size: 0.9em;
  white-space: nowrap;
  pointer-events: none;
  transform: translateY(-100%);
}
</style>
