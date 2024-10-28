<template>
  <v-dialog v-model="showDialog" max-width="1000" scrollable>
    <v-card>
      <v-card-title class="text-h4 text-center pb-0">Welcome to Satisfactory Factories!</v-card-title>
      <v-card-subtitle class="text-center">Bringing sanity to modular factories!</v-card-subtitle>
      <v-card-text class="text-body-1 text-left">
        <p class="text-h5">Why does this tool exist?</p>
        <p><b>Satisfactory Factories</b> is designed to help you plan and manage modular (or floors of a mega-factory) factory production chains. As your factory demands scale (e.g. starting a new tier), keeping track of all the interconnected elements of your production chain can become overwhelming, often leading to overlooked areas and production bottlenecks without realising. This tool automates the calculations, ensuring that every part of your factory scales properly to meet new demands, saving you from tedious and repetitive math.</p>
        <p>Unlike other production planners, such as Satisfactory Tools, Satisfactory Factories focuses on a per-factory level of demand rather than what you need to produce a particular part (although it can do that on a per-factory level). You can use Satisfactory Tools to determine the quantities of parts you need and then use this tool to map out and visualize the factories required to meet those numbers, and maintain the production chain in future changes.</p>
        <div class="py-2 mb-4 border-t-md border-b-md rounded">
          <p class="text-h5">Enough yapping, how does it work?</p>
          <ul class="ml-4 mb-4">
            <li>Firstly you create a <i class="fas fa-industry mr-2" /><b>Factory</b> (and give it a name!).</li>
            <li>Then you define the <i class="fas fa-conveyor-belt-alt mr-2" /><b>Products</b> it is going to produce. You can also set up production items to use other items internally, these will be marked as <v-chip color="green">internal</v-chip>.</li>
            <li>Create other factories and link factories together via an <i class="fas fa-arrow-to-right mr-2" /><b>Import</b>. These use the Exports of other factories.</li>
            <li>The <i class="fas fa-check mr-2" /><b>Satisfaction</b> section then tells you if you're short of inputs or internal production to satisfy the factory's demands.</li>
            <li>Any surplus (items left over after internal production requirements) will be marked under the <i class="fa fa-truck-container mr-2" /><b>Exports</b> section.</li>
            <li>In the supplying factory you are then informed of the demands upon it, and if there are any issues with production that needs to increase due to the demands set upon it.</li>
            <li>Factories that don't have enough imports / internal production to match demand or don't produce enough to satisfy depending factories, are marked in <span class="text-red">red</span> on both the main factory view and the list to the left.</li>
          </ul>
          <p>My suggestion would be to start from "Goal first". Define a factory producing end products, then work your way back from there to the very base level products. But you can plan however you like!</p>
        </div>

        <div class="px-2 py-2 mb-4 bg-blue-grey-darken-3 rounded">
          <p>
            Please note - this project is in an <span class="text-orange font-weight-bold">alpha</span> state, it is very hot out of the oven and there may <i>(will)</i> be some bugs. Please report any bugs to the project's <a href="https://github.com/Maelstromeous/satisfactory-modular-facs/issues">GitHub Issues page</a> for now.
          </p>
          <p>Each page has a Todo section with what I plan to add. Please offer any suggestions at the GitHub link above for any improvements you'd like to see.</p>
        </div>
        <p>Happy planning! - Maelstromeous</p>
      </v-card-text>
      <v-card-actions>
        <v-btn color="blue" @click="close">
          <i class="fas fa-file" /><span class="ml-2">Start with an empty plan</span>
        </v-btn>
        <v-btn color="green" variant="elevated" @click="showDemo">
          <i class="fas fa-list" /><span class="ml-2">Start with a demo plan</span>
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<script setup lang="ts">
  import { defineEmits } from 'vue'

  const props = defineProps<{
    introShow: boolean
  }>()

  const showDialog = ref<boolean>(false)

  onMounted(() => {
    console.log('Intro show:', props.introShow)
    showDialog.value = props.introShow
  })

  // Setup a watcher to close the dialog when the prop changes
  watch(() => props.introShow, value => {
    showDialog.value = value
  })

  // Setup a watcher if the dialogue is changed to closed, we emit the event by calling close()
  watch(() => showDialog.value, value => {
    if (!value) {
      console.log('Closing intro via watch')
      close()
    }
  })

  const emit = defineEmits<{
    (event: 'showDemo'): void;
    (event: 'close'): void;
  }>()

  const showDemo = () => {
    console.log('Showing demo')
    emit('showDemo')
    close()
  }

  const close = () => {
    console.log('Closing introduction')
    emit('close')
    showDialog.value = false
  }
</script>
<style lang="scss" scoped>
p {
  margin-bottom: 16px;

  &:last-child {
    margin-bottom: 0;
  }
}
</style>
