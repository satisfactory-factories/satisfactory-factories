import { FactoryTab } from '@/interfaces/planner/FactoryInterface'

export interface BackendPlannerStateResponse {
  user: string;
  currentTabId: string;
  tabs: FactoryTab[];
  userOptions: string[];
  lastSaved: Date;
  lastEdited: Date;
}
