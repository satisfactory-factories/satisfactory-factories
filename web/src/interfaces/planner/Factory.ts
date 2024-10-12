export interface Factory {
  id: number;
  name: string;
  inputs: Array<{
    groupId: number;
    outputPart: string;
    amount: number;
  }>;
  products: FactoryProduct[];
  outputs: FactoryProduct[];
  partsRequired: { [key: string]: { amount: number, amountOriginal: number, satisfied: boolean } };
  inputsSatisfied: boolean;
  rawResources: WorldRawResource;
  surplus: { [key: string]: number }; // Surplus products
  surplusHandling: { [key: string]: 'export' | 'sink' }; // How to handle surplus
  hidden: boolean; // Whether to hide the card or not
}

export interface FactoryProduct {
  id: string;
  recipe: string;
  amount: number;
}

export interface FactoryDependency {
  [key: string]: {
    requestedBy: { [key: string]: FactoryDependencyRequest[] },
    metrics: { [key: string]: FactoryDependencyMetrics },
  };
}

export interface FactoryDependencyRequest {
  part: string;
  amount: number;
  requestedBy: number;
}

export interface FactoryDependencyMetrics {
  part: string;
  request: number;
  supply: number;
  isRequestSatisfied: boolean;
}

export interface WorldRawResource {
  [key: string]: {
    name: string;
    amount: number;
  }
}
