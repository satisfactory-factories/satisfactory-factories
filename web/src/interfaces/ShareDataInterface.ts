import { Factory } from '@/interfaces/planner/FactoryInterface'

export interface ShareDataCreationResponse {
  status: string;
  shareId: string;
}

export interface ShareDataReturnResponse {
  data: Factory[]
}
