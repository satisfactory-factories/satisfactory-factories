import { FactoryTab } from '@/interfaces/planner/FactoryInterface'

export interface BackendFactoryDataResponse {
  user: string;
  tabs: FactoryTab[];
  lastSaved: Date
}
