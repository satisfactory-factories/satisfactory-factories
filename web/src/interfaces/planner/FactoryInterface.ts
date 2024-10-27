export interface PartMetrics {
  amountRequired: number; // Total amount required by all products on the line
  amountSupplied: number; // Total amount of supply used for display purposes
  amountSuppliedViaInput: number; // This is the amount supplied by the inputs
  amountSuppliedViaProduction: number; // This is the amount supplied by internal products
  amountRemaining: number; // This is the amount remaining after all inputs and internal products are accounted for. Can be a minus number, which is used for surplus calculations.
  isRaw: boolean; // Whether the part is a raw resource or not, if so it will always be marked as satisfied.
  satisfied: boolean; // Use of use flag for templating.
}

export interface BuildingRequirement {
  name: string;
  amount: string;
  powerPerBuilding: string;
  totalPower: string;
}

export interface ByProductItem {
  id: string;
  amount: number;
  byProductOf: string; // Product ID
}

export interface FactoryItem {
  id: string;
  recipe: string;
  amount: number;
  displayOrder: number;
  requirements: { [key: string]: { amount: number } };
  buildingRequirements: BuildingRequirement
  byProducts: ByProductItem[];
}

export interface FactorySurplusItem {
  amount: number;
  surplusHandling: 'export' | 'sink';
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
  difference: number;
}

export interface ExportCalculatorFactorySettings {
  trainTime: number;
}

export interface ExportCalculatorSettings {
  selected: string | null;
  factorySettings: {
    [key: string] : ExportCalculatorFactorySettings
  }
}

export interface FactoryDependency {
  requests: { [key: string]: FactoryDependencyRequest[] },
  metrics: { [key: string]: FactoryDependencyMetrics },
}

export interface WorldRawResource {
  id: string;
  name: string;
  amount: number;
}

export interface FactoryImport {
  factoryId: number | null;
  outputPart: string | null;
  amount: number
}

export interface FactoryInternalProduct {
  id: string;
  amount: number
}

export interface Factory {
  id: number;
  name: string;
  inputs: FactoryImport[];
  products: FactoryItem[];
  internalProducts: { [key: string]: FactoryInternalProduct };
  parts: { [key: string]: PartMetrics };
  buildingRequirements: { [key: string]: BuildingRequirement };
  requirementsSatisfied: boolean;
  totalPower: string;
  surplus: { [key: string]: FactorySurplusItem };
  dependencies: FactoryDependency;
  exportCalculator: { [key: string]: ExportCalculatorSettings };
  rawResources: { [key: string]: WorldRawResource };
  usingRawResourcesOnly: boolean;
  hidden: boolean; // Whether to hide the card or not
  hasProblem: boolean
  displayOrder: number;
}
