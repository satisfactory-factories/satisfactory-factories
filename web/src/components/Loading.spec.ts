import { describe, expect, it } from 'vitest'
import {screen} from '@testing-library/vue'
import Loading from '@/components/Loading.vue'
import {vuetifyRender} from "@/utils/ui-test-bootstrap";
import eventBus from "@/utils/eventBus";

describe('Loading.vue', () => {
  it('should show loading message when loading starts', async () => {
    vuetifyRender(Loading)

    screen.getByText('Loading Planner...')
  })

    it('should stop showing the loading message when loading has finished', async () => {
      vuetifyRender(Loading)

      // Wait for a tick
      await new Promise(resolve => setTimeout(resolve, 1000))

      eventBus.emit('loadingCompleted')

      await new Promise(resolve => setTimeout(resolve, 1000))

      expect(screen.getByText('Loading Planner...')).toBe(false)
  })
})
