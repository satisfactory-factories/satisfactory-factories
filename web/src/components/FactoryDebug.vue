<template>
  <v-dialog v-if="isDebugMode" scrollable width="auto">
    <template #activator="{ props: activatorProps }">
      <v-btn
        v-if="isCompact"
        v-bind="activatorProps"
        class="mr-2 rounded"
        color="primary"
        icon="fas fa-bug"
        ripple
        size="small"
        variant="flat"
      />
      <v-btn
        v-else
        v-bind="activatorProps"
        class="mr-2"
        color="primary"
        prepend-icon="fas fa-bug"
        ripple
        variant="flat"
      >
        Show data
      </v-btn>
    </template>
    <template #default="{ isActive }">
      <v-card :title="title">
        <v-card-text>
          <pre>
{{ subject }}
                    </pre>
        </v-card-text>
        <v-card-actions class="sticky">
          <v-btn
            v-if="!isCopied"
            color="green"
            prepend-icon="fas fa-file"
            text="Copy data"
            @click="clipboard(subject)"
          />
          <v-btn
            v-if="isCopied"
            color="green"
            prepend-icon="fas fa-file"
            text="Copied!"
            @click="clipboard(subject)"
          />
          <v-btn
            color="primary"
            prepend-icon="fas fa-times"
            text="Close"

            @click="isActive.value = false"
          />
        </v-card-actions>
      </v-card>
    </template>
  </v-dialog>
</template>
<script lang="ts" setup>
  import { useAppStore } from '@/stores/app-store'

  const props = defineProps<{
    isCompact?: boolean;
    subject: any;
    subjectType: string;
  }>()

  const { isDebugMode } = useAppStore()
  const isCopied = ref(false)
  const title = computed(() => `${props.subjectType} debug info`)

  const clipboard = (subject: any) => {
    navigator.clipboard.writeText(JSON.stringify(subject))
    isCopied.value = true
    console.log(`Copied ${props.subjectType} data to clipboard`)
  }
</script>
