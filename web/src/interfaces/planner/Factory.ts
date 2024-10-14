export interface PartRequirement {
  [key: string]: {
    amountRequired: number; // Total amount required by all products on the line
    amountSupplied: number; // Total amount of supply used for display purposes
    amountSuppliedViaInput: number; // This is the amount supplied by the inputs
    amountSuppliedViaInternal: number; // This is the amount supplied by internal products
    amountSuppliedViaRaw: number; // This is the amount supplied by raw resources
    amountRemaining: number; // This is the amount remaining after all inputs and internal products are accounted for. Can be a minus number, which is used for surplus calculations.
    satisfied: boolean; // Use of use flag for templating.
  }
}

export interface FactoryItem {
  id: string;
  recipe: string;
  amount: number;
  displayOrder: number;
  requirements: { [key: string]: { amount: number }};
}

export interface FactorySurplusItem extends FactoryItem {
  [key: string]: {
    surplusHandling: 'export' | 'sink';
  }
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

export interface FactoryDependency {
  [key: string]: {
    requestedBy: { [key: string]: FactoryDependencyRequest[] },
    metrics: { [key: string]: FactoryDependencyMetrics },
  };
}

export interface WorldRawResource {
  [key: string]: {
    name: string;
    amount: number;
  }
}

export interface Factory {
  id: number;
  name: string;
  inputs: Array<{
    groupId: number;
    outputPart: string;
    amount: number;
  }>;
  products: FactoryItem[];
  internalProducts: FactoryItem;
  partRequirements: PartRequirement;
  requirementsSatisfied: boolean;
  surplus: FactorySurplusItem;
  dependencies: FactoryDependency;
  rawResources: WorldRawResource;
  hidden: boolean; // Whether to hide the card or not
  hasProblem: boolean
}
