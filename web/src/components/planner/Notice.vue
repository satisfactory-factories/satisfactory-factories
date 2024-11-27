<template>
  <v-row>
    <v-col>
      <v-card class="factory-card">
        <v-row class="header">
          <v-col class="flex-grow-1" cols="8">
            <h1 class="text-h5 text-md-h4"><i class="fas fa-bug" /> Top upcoming features / known bugs</h1>
          </v-col>
          <v-col class="text-right" cols="4">
            <v-chip v-if="newChanges" class="changes font-weight-bold" color="green">New changes!</v-chip>
            <v-btn
              v-show="!issuesShow"
              class="rounded"
              color="primary"
              prepend-icon="fas fa-eye"
              variant="outlined"
              @click="issuesShow = true"
            >Show</v-btn>
            <v-btn
              v-show="issuesShow"
              class="rounded"
              color="primary"
              prepend-icon="fas fa-eye-slash"
              variant="outlined"
              @click="issuesShow = false"
            >Hide</v-btn>
          </v-col>
        </v-row>
        <v-card-text v-show="issuesShow" class="text-body-1">
          <p class="mb-2">
            Roughly in priority order. Please report any bugs or feature requests to <v-btn class="px-2" color="blue" density="compact" href="https://github.com/Maelstromeous/satisfactory-factories/issues"><i class="fab fa-github mr-1" />SF's GitHub issues</v-btn>. If you encounter any new bugs or wish to add your input to a feature request, go to the link and let your voice be known!
          </p>
          <v-table class="text-body-1" density="comfortable">
            <thead>
              <tr>
                <th class="text-center" scope="col">Status</th>
                <th class="text-center" scope="col">Type</th>
                <th scope="col">Description</th>
                <th class="text-center" scope="col">Updated</th>
                <th class="text-center" scope="col">Link</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="issue in issues" :key="issue.link">
                <td class="text-center">
                  <v-chip :color="statusChipColor(issue)">{{ issue.status.toUpperCase() }}</v-chip>
                </td>
                <td class="text-center">
                  <v-chip :color="typeChipColor(issue)">{{ typeDisplay(issue) }}</v-chip>
                </td>
                <td>{{ issue.description }}</td>
                <td>{{ issue.updated.toLocaleString() }}</td>
                <td>
                  <v-btn
                    v-if="issue.link"
                    color="blue"
                    :href="issue.link"
                  >
                    <i class="fab fa-github mr-1" />Github Issue
                  </v-btn>
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>
<script setup lang="ts">
  interface Issue {
    description: string
    type: 'bug' | 'feature'
    severity: 'major' | 'minor'
    status: 'open' | 'closed'
    updated: Date
    link: string
  }

  const currentChangeId = '2024-11-24' // Change this when the list gets updated to prompt people to have a look
  const lastSeenChangeId = ref<string>(
    localStorage.getItem('lastSeenChangeId') ?? ''
  )
  const newChanges = ref<boolean>(lastSeenChangeId.value !== currentChangeId)

  // Function to mark the current change ID as seen
  const markChangesAsSeen = () => {
    lastSeenChangeId.value = currentChangeId
    localStorage.setItem('lastSeenChangeId', currentChangeId)
    newChanges.value = false
  }

  // Initial setup to sync new changes state
  if (lastSeenChangeId.value === currentChangeId) {
    newChanges.value = false
  } else {
    newChanges.value = true
  }

  // State for issues visibility and the last seen change ID
  const issuesShow = ref<boolean>(
    localStorage.getItem('issuesShow') === null
      ? false
      : localStorage.getItem('issuesShow') === 'false'
  )

  // Watch for changes to issuesShow
  watch(issuesShow, value => {
    localStorage.setItem('issuesShow', value.toString())
    markChangesAsSeen()
  })

  const issues: Issue[] = [
    {
      description: 'Imports are not showing up for collapsed / hidden factories.',
      type: 'bug',
      severity: 'minor',
      status: 'open',
      updated: new Date('2024-11-18 15:01:00Z+0000'),
      link: 'https://github.com/Maelstromeous/satisfactory-factories/issues/6',
    },
    {
      description: 'Missing internal chip next to byproducts that are used internally.',
      type: 'bug',
      severity: 'minor',
      status: 'open',
      updated: new Date('2024-11-18 15:01:00Z+0000'),
      link: 'https://github.com/Maelstromeous/satisfactory-factories/issues/13',
    },
    {
      description: 'Overclocking / Somersloops (WIP, omitted for Alpha release, it\'s a LOT of math!).',
      type: 'feature',
      severity: 'major',
      status: 'open',
      updated: new Date('2024-11-18 15:01:00Z+0000'),
      link: 'https://github.com/Maelstromeous/satisfactory-factories/issues/11',
    },
    {
      description: 'Goal Maker - Configure a goal to show on the right side enable the creation of factories to meet the demand.',
      type: 'feature',
      severity: 'major',
      status: 'open',
      updated: new Date('2024-11-18 15:01:00Z+0000'),
      link: 'https://github.com/Maelstromeous/satisfactory-factories/issues/17',
    },
    {
      description: 'Optimise vertical space / reduce clutter.',
      type: 'feature',
      severity: 'minor',
      status: 'open',
      updated: new Date('2024-11-18 15:01:00Z+0000'),
      link: 'https://github.com/Maelstromeous/satisfactory-factories/issues/58',
    },
    {
      description: 'Add ability to add icon to factory.',
      type: 'feature',
      severity: 'minor',
      status: 'open',
      updated: new Date('2024-11-18 15:01:00Z+0000'),
      link: 'https://github.com/Maelstromeous/satisfactory-factories/issues/14',
    },
    {
      description: 'Show unsatisfied demands of the plan for easy creation of new factories to fulfil demands.',
      type: 'feature',
      severity: 'minor',
      status: 'open',
      updated: new Date('2024-11-18 15:01:00Z+0000'),
      link: 'https://github.com/Maelstromeous/satisfactory-factories/issues/15',
    },
    {
      description: 'When adding a product, a default recipe should be chosen.',
      type: 'feature',
      severity: 'minor',
      status: 'open',
      updated: new Date('2024-11-18 15:01:00Z+0000'),
      link: 'https://github.com/Maelstromeous/satisfactory-factories/issues/28',
    },
    {
      description: 'World Resources: Make world resources flag an issue when exceeding world limits. Show %age used.',
      type: 'bug',
      severity: 'minor',
      status: 'open',
      updated: new Date('2024-11-18 15:01:00Z+0000'),
      link: 'https://github.com/Maelstromeous/satisfactory-factories/issues/20',
    },
    {
      description: 'Password resets (use a password manager for now! 🔐).',
      type: 'feature',
      severity: 'minor',
      status: 'open',
      updated: new Date('2024-11-18 15:01:00Z+0000'),
      link: 'https://github.com/Maelstromeous/satisfactory-factories/issues/22',
    },
    {
      description: 'Export / Import factory data.',
      type: 'feature',
      severity: 'minor',
      status: 'open',
      updated: new Date('2024-11-18 15:01:00Z+0000'),
      link: 'https://github.com/Maelstromeous/satisfactory-factories/issues/22',
    },
    {
      description: 'Real time collaboration.',
      type: 'feature',
      severity: 'minor',
      status: 'open',
      updated: new Date('2024-11-18 15:01:00Z+0000'),
      link: 'https://github.com/Maelstromeous/satisfactory-factories/issues/33',
    },

    // CLOSED
    {
      description: "Various recipes are reporting incorrect power values. Don't trust the power values until this is resolved.",
      type: 'bug',
      severity: 'major',
      status: 'closed',
      updated: new Date('2024-11-24 23:01:00Z+0000'),
      link: 'https://github.com/Maelstromeous/satisfactory-factories/issues/35',
    },
    {
      description: 'Quantum Encoder & Particle Accelerator has no power values.',
      type: 'bug',
      severity: 'minor',
      status: 'closed',
      updated: new Date('2024-11-24 23:01:00Z+0000'),
      link: 'https://github.com/Maelstromeous/satisfactory-factories/issues/26',
    },
    {
      description: 'Quantum Converter support (omitted for Alpha release), it\'s a surprisingly complex thing to get right...',
      type: 'feature',
      severity: 'major',
      status: 'closed',
      updated: new Date('2024-11-24 23:01:00Z+0000'),
      link: 'https://github.com/Maelstromeous/satisfactory-factories/issues/64',
    },
    {
      description: 'Inflated ingredient amounts for recipes creating more than 1 item per run.',
      type: 'bug',
      severity: 'major',
      status: 'closed',
      updated: new Date('2024-11-16 14:45:00Z+0000'),
      link: 'https://github.com/Maelstromeous/satisfactory-factories/issues/3',
    },
    {
      description: 'Multiple products of the same item using different recipes will only be counted once (the last entry).',
      type: 'bug',
      severity: 'minor',
      status: 'closed',
      updated: new Date('2024-11-18 14:45:00Z+0000'),
      link: 'https://github.com/Maelstromeous/satisfactory-factories/issues/9',
    },
    {
      description: 'Allow ability to add duplicate products to a factory (in case you split processing of them up).',
      type: 'feature',
      severity: 'minor',
      status: 'closed',
      updated: new Date('2024-11-18 14:45:00Z+0000'),
      link: 'https://github.com/Maelstromeous/satisfactory-factories/issues/9',
    },
    {
      description: 'Factory Copy / Cloning.',
      type: 'feature',
      severity: 'minor',
      status: 'closed',
      updated: new Date('2024-11-18 21:29:00Z+0000'),
      link: 'https://github.com/Maelstromeous/satisfactory-factories/issues/31',
    },
  ]

  const statusChipColor = (issue: Issue) => {
    return issue.status === 'open' ? 'gray' : 'green'
  }

  const typeDisplay = (issue: Issue) => {
    if (issue.type === 'bug' && issue.severity === 'major') return 'MAJOR BUG'
    if (issue.type === 'feature' && issue.severity === 'major') return 'Major feature'
    return issue.type === 'bug' ? 'Bug' : 'Feature'
  }

  const typeChipColor = (issue: Issue) => {
    if (issue.type === 'bug' && issue.severity === 'major') return 'red'
    return issue.type === 'bug' ? 'orange' : 'gray'
  }
</script>

<style lang="scss">
.changes {
  margin-right: 8px;
  border: 2px solid green;
}
</style>
