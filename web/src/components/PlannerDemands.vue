<template>
  <div style="text-align: left;">
    <h3>Totals</h3>
    <ul style="text-align: left">
      <li v-for="(partData, index) in dependency.metrics" :key="index">
        <span :style="satisfactionTextColor(partData.isDemandSatisfied)">{{ getPartDisplayName(partData.part) }}: {{ partData.demand }}/min</span>
      </li>
    </ul>
    <!-- Loop through the demands for the group -->
    <div v-for="(demands, groupId) in dependency.demandedBy" :key="groupId">
      <h3>{{ getGroupById(groupId).name }}</h3>
      <ul style="text-align: left">
        <li v-for="demand in demands">{{ getPartDisplayName(demand.part) }}: {{ demand.amount }}/min</li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  props: {
    dependency: {
      type: Object,
      required: true,
    },
    groups: {
      type: Object,
      required: true,
    },
    data: {
      type: Object,
      required: true,
    }
  },
  methods: {
    getGroupById(id: number) {
      return this.groups.filter((group => group.id === parseInt(id)))[0];
    },
    getPartDisplayName(part: string | number) {
      return this.data.items.rawResources[part]?.name || this.data.items.parts[part];
    },
    satisfactionTextColor(satisfaction: boolean) {
      return {
        color: satisfaction ? 'green' : 'red'
      }
    }
  }
}
</script>