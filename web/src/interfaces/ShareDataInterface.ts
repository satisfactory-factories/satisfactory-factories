import { Factory } from '@/interfaces/planner/FactoryInterface'

export interface ShareDataCreationResponse {
  status: string;
  link: string;
}

export interface ShareDataReturnResponse {
  data: Factory[]
}
