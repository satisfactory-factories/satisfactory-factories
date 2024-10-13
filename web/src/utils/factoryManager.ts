import { Factory, FactoryDependency } from "@/interfaces/planner/Factory";
import {DataInterface} from "@/interfaces/DataInterface";

export const updateFactoryRequirements = (factory: Factory, gameData: DataInterface) => {
  factory.partsRequired = {};
  factory.rawResources = {};
  factory.surplus = {};

  // First loop through each product and add it to internal requirements and surplus.
  factory.products.forEach(product => {
    const recipe = gameData.recipes.find(r => r.id === product.recipe);
    if (!recipe) {
      console.error(`Recipe with ID ${product.recipe} not found.`);
      return;
    }

    // Calculate the ingredients needed to make this product.
    recipe.ingredients.forEach(ingredientPart => {
      const [part, partAmount] = Object.entries(ingredientPart)[0];
      if (isNaN(partAmount)) {
        console.warn(`Invalid ingredient amount for ingredient ${part}. Skipping.`);
        return;
      }

      // If it's a raw resource, mark it as fully supplied and don't mark it as a part required.
      const isRaw = !!gameData.items.rawResources[part];
      if (isRaw) {
        if (!factory.rawResources[part]) {
          factory.rawResources[part] = {
            name: gameData.items.rawResources[part].name,
            amount: 0,
          };
        }
        factory.rawResources[part].amount = partAmount * product.amount;
        factory.rawResources[part].satisfied = true;
      } else {
        if (!factory.partsRequired[part]) {
          factory.partsRequired[part] = {
            amountNeeded: 0,
            amountSupplied: 0,
            satisfied: true, // So we don't get a big red bot as soon as we add a product.
          };
        }

        factory.partsRequired[part].amountNeeded += partAmount * product.amount;

        // Check satisfaction
        if (!factory.partsRequired[part].amountSupplied <= factory.partsRequired[part].amountNeeded) {
          factory.partsRequired[part].satisfied = false;
        }
      }
    });

    // Any remaining product that is not used internally is surplus.
    if (!factory.surplus[product.id]) {
      factory.surplus[product.id] = 0;

      // If the handling isn't already set (so we don't blow it away again)
      if (!factory.surplusHandling[product.id]) {
        factory.surplusHandling[product.id] = 'export'; // Assume user will export it by default
      }
    }

    // If the user has chosen to sink the resources, we don't need to calculate the surplus and zero it out
    if (factory.surplusHandling[product.id] === 'sink') {
      factory.surplus[product.id] = 0;
    } else {
      factory.surplus[product.id] += product.amount;
    }
  });

  // Satisfy internal requirements with existing group products (like screws from iron rods).
  Object.keys(factory.partsRequired).forEach(part => {
    // If it's raw, don't bother
    if (!factory.partsRequired[part]) {
      return;
    }

    const requirement = factory.partsRequired[part];

    factory.products.forEach(product => {
      if (product.id === part) {
        const usedAmount = Math.min(product.amount, requirement.amountNeeded - requirement.amountSupplied);
        requirement.amountSupplied += usedAmount;

        // Reduce surplus amount accordingly.
        if (factory.surplus[product.id]) {
          factory.surplus[product.id] = Math.max(0, factory.surplus[product.id] - usedAmount);
        }

        requirement.satisfied = requirement.amountSupplied >= requirement.amountNeeded;
      }
    });
  });
}

// Calculate based on the inputs of the group if the requirements are satisfied.
export const updateFactorySatisfaction = (factory: Factory) => {
  Object.keys(factory.inputs).forEach(input => {
    const part = factory.inputs[input].outputPart;
    const requirement = factory.partsRequired[part];

    if (!requirement) {
      console.error(`Part ${part} not found in requirements.`);
      return;
    }

    // How get the amount of supply provided by the input
    requirement.amountSupplied += factory.inputs[input].amount

    // Check if the input amount is enough to satisfy the requirement.
    const satisfied = requirement.amountSupplied >= requirement.amountNeeded;

    if (satisfied) {
      requirement.satisfied = true;
    }

    // If the part has 0 requirements it is technically satisfied
    if (requirement.amountNeeded == 0) {
      requirement.satisfied = true;
    }
  });

  // Now check if all requirements are satisfied.
  factory.inputsSatisfied = Object.keys(factory.partsRequired).every(part => factory.partsRequired[part].satisfied);
}

export const calculateDependencies = (factories): FactoryDependency => {
  const newDependencies: FactoryDependency = {};

  // Iterate through factories to build the initial dependencies with requests
  factories.forEach(factory => {
    factory.inputs.forEach(input => {
      // Check if the input is actually still valid, if the user has set an resource to sink this is no longer valid.
      // We do this by checking the requested group to see if the surplus is still there.
      const requestedGroup = factories.find(g => g.id === input.groupId);

      // We need to pick up on the following conditions:
      // 1. The group is no longer valid (e.g. the user has set it to sink)
      // 2. The group is valid but the product is no longer available, BUT not if it's undefined e.g. "" because the UI is still being edited.
      if (!requestedGroup || !requestedGroup.surplus[input.outputPart] && input.outputPart !== "") {
        console.warn('Input is no longer valid, removing it.', input);
        // Remove the input from the group
        factory.inputs = factory.inputs.filter(i => i !== input);

        // Run the requirements check again just for this affected group
        updateFactory(factory);
        return;
      }

      const request = {
        part: input.outputPart,
        amount: input.amount,
      };

      // Create an entry for the group that is being requested from if it doesn't exist
      if (!newDependencies[input.groupId]) {
        newDependencies[input.groupId] = {
          requestedBy: {},
          metrics: {},
        };
      }

      // Create requests array for the specific group relationship if it doesn't exist
      if (!newDependencies[input.groupId].requestedBy[factory.id]) {
        newDependencies[input.groupId].requestedBy[factory.id] = [];
      }

      // Add the requests to the appropriate group
      newDependencies[input.groupId].requestedBy[factory.id].push(request);
    });
  });

  // Now loop through the dependencies and calculate the total requests upon each part within the group
  Object.keys(newDependencies).forEach(groupDepId => {
    const groupDependency = newDependencies[groupDepId];

    Object.keys(groupDependency.requestedBy).forEach(depGroupId => {
      const depGroup = groupDependency.requestedBy[depGroupId];
      depGroup.forEach(request => {
        const part = request.part;

        if (!groupDependency.metrics[part]) {
          groupDependency.metrics[part] = {
            part,
            request: 0,
            supply: 0,
            isRequestSatisfied: false,
          };
        }

        groupDependency.metrics[part].request += request.amount;
      });
    });

    // Calculate the supply and whether the request is satisfied
    const thisGroup = factories.find(group => group.id === parseInt(groupDepId));

    Object.keys(thisGroup.surplus).forEach(product => {
      const amount = thisGroup.surplus[product]; // Get the amount of the product from the surplus object

      if (groupDependency.metrics[product]) {
        groupDependency.metrics[product].supply = amount;
        groupDependency.metrics[product].isRequestSatisfied = amount >= groupDependency.metrics[product].request;
      }
    });
  });

  // Replace the existing dependencies with the new ones
  return newDependencies;
}
