export interface Group {
  id: number;
  name: string;
  inputs: Array<{
    groupId: number;
    outputPart: string;
    amount: number;
  }>;
  products: GroupProduct[];
  outputs: GroupProduct[];
  partsRequired: { [key: string]: { amount: number, amountOriginal: number, satisfied: boolean } };
  inputsSatisfied: boolean;
  rawResources: WorldRawResource[];
  surplus: { [key: string]: number }; // Surplus products
  surplusHandling: { [key: string]: 'export' | 'sink' }; // How to handle surplus
  hidden: boolean; // Whether to hide the card or not
}

export interface GroupDependencyRequest {
  part: string;
  amount: number;
}

export interface GroupDependencyRequestMetrics {
  part: string;
  request: number;
  supply: number;
  isRequestSatisfied: boolean;
}

export interface GroupDependency {
  [key: string]: {
    requestedBy: { [key: string]: GroupDependencyRequest[] },
    metrics: { [key: string]: GroupDependencyRequestMetrics },
  };
}

export interface GroupProduct {
  id: string;
  recipe: string;
  amount: number;
}

export interface WorldRawResource {
  name: string;
  amount: number;
}
