<template>
  <div style="text-align: left;">
    <ul v-for="(partData, index) in requests.metrics" :key="index">
      <li :style="satisfactionTextColor(partData.isRequestSatisfied)"><b>{{ getPartDisplayName(partData.part) }}: {{ partData.request }}/min</b>
        <ul>
          <li v-for="reqGroup in getRequestsByPart(partData.part)">{{ getGroupById(reqGroup).name }} ({{ partData.request }}/min)</li>
        </ul>
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
export default {
  props: {
    requests: {
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
  computed: {
    areRequestsMet() {
      // every doesn't work
      for (const partData of Object.values(this.requests.metrics)) {
        if (!partData.isRequestSatisfied) {
          return false;
        }
      }
      return true
    }
  },
  methods: {
    getGroupById(id: number) {
      return this.groups.filter((group => group.id === parseInt(id)))[0];
    },
    getPartDisplayName(part: string | number) {
      return this.data.items.rawResources[part]?.name || this.data.items.parts[part];
    },
    getRequestsByPart(part: string | number) {
      return Object.keys(this.requests.requestedBy).filter((groupId) => {
        return this.requests.requestedBy[groupId].some((request) => request.part === part);
      });
    },
    satisfactionTextColor(satisfaction: boolean) {
      return {
        color: satisfaction ? 'green' : 'red'
      }
    }
  }
}
</script>