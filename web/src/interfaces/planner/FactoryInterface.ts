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

export interface BuildingRequirement {
  name: string;
  amount: number;
  powerPerBuilding: number;
  totalPower: number;
}

export interface FactoryItem {
  id: string;
  recipe: string;
  amount: number;
  displayOrder: number;
  requirements: { [key: string]: { amount: number }};
  buildingRequirements: BuildingRequirement
}

export interface FactorySurplusItem extends FactoryItem {
  [key: string]: {
    surplusHandling: 'export' | 'sink';
  }
}

export interface FactoryDependencyRequest {
  part: string;
  amount: number;
}

export interface FactoryDependencyMetrics {
  part: string;
  request: number;
  supply: number;
  isRequestSatisfied: boolean;
}

export interface ExportCalculatorSettings {
  [key: string]: {
    trainTime: number;
  }
}

export interface FactoryDependency {
  [key: string]: {
    requests: { [key: string]: FactoryDependencyRequest[] },
    metrics: { [key: string]: FactoryDependencyMetrics },
  };
}

export interface WorldRawResource {
  [key: string]: {
    id: string;
    name: string;
    amount: number;
  }
}

export interface FactoryImport {
  groupId: number;
  outputPart: string;
  amount: number
}

export interface Factory {
  id: number;
  name: string;
  inputs: FactoryImport[];
  products: FactoryItem[];
  internalProducts: FactoryItem;
  partRequirements: PartRequirement;
  buildingRequirements: BuildingRequirement;
  requirementsSatisfied: boolean;
  totalPower: number;
  surplus: FactorySurplusItem;
  dependencies: FactoryDependency;
  exportCalculator: {
    selected: string | null
    settings: ExportCalculatorSettings
  }
  rawResources: WorldRawResource;
  usingRawResourcesOnly: boolean;
  hidden: boolean; // Whether to hide the card or not
  hasProblem: boolean
  displayOrder: number;
}
