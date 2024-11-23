import * as fs from 'fs-extra';
import * as path from 'path';
import * as iconv from 'iconv-lite';
import {Recipe} from "./interfaces/Recipe";

// Function to detect if the file is UTF-16
async function isUtf16(inputFile: string): Promise<boolean> {
    const buffer = await fs.readFile(path.resolve(inputFile));
    const bomLE = buffer[0] === 0xFF && buffer[1] === 0xFE;
    const bomBE = buffer[0] === 0xFE && buffer[1] === 0xFF;
    return bomLE || bomBE;
}

// Function to read UTF-16 and convert to UTF-8
async function readFileAsUtf8(inputFile: string): Promise<string> {
    const isUtf16Encoding = await isUtf16(inputFile);
    if (isUtf16Encoding) {
        const buffer = await fs.readFile(path.resolve(inputFile));
        const content = iconv.decode(buffer, 'utf-16le');
        return normalizeLineEndings(content);
    } else {
        // noinspection JSVoidFunctionReturnValueUsed
        const content = await fs.readFile(path.resolve(inputFile), 'utf-8');
        return normalizeLineEndings(content);
    }
}

// Helper function to normalize line endings
function normalizeLineEndings(content: string): string {
    return content.replace(/\r\n/g, '\n');
}

// Function to clean up the input file to make it valid JSON
function cleanInput(input: string): string {
    let cleaned = input.replace(/\r\n/g, '\n');
    cleaned = cleaned.replace(/,\s*([\]}])/g, '$1');
    return cleaned;
}

// Blacklist for excluding items produced by the Build Gun
const blacklist = [
    "/Game/FactoryGame/Equipment/BuildGun/BP_BuildGun.BP_BuildGun_C",
];

// Helper function to determine if an ingredient is a collectable (e.g., Power Slug)
function isCollectable(ingredients: string): boolean {
    const collectableDescriptors = [
        "Desc_Crystal.Desc_Crystal_C",        // Blue Power Slug
        "Desc_Crystal_mk2.Desc_Crystal_mk2_C", // Yellow Power Slug
        "Desc_Crystal_mk3.Desc_Crystal_mk3_C"  // Purple Power Slug
    ];
    return collectableDescriptors.some(descriptor => ingredients.includes(descriptor));
}

// Helper function to check if a recipe is likely to be liquid based on building type and amount
function isFluid(productName: string): boolean {
    const liquidProducts = ['water', 'liquidoil', 'heavyoilresidue', 'liquidfuel', 'liquidturbofuel', 'liquidbiofuel', 'aluminasolution', 'sulfuricacid', 'nitricacid', 'dissolvedsilica']
    const gasProducts = ['nitrogengas', 'rocketfuel', 'ionizedfuel', 'quantumenergy', 'darkenergy'];

    if (liquidProducts.includes(productName.toLowerCase())) {
        return true;
    }

    return gasProducts.includes(productName.toLowerCase());
}

function isFicsmas(displayName: string): boolean {
    return displayName.includes("FICSMAS") ||
        displayName.includes("Snow") ||
        displayName.includes("Candy") ||
        displayName.includes("Fireworks");
}

interface Part {
    name: string;
    stackSize: number;
    isFluid: boolean;
    isFicsmas: boolean;
}

interface PartDataInterface {
    parts: { [key: string]: Part };
    collectables: { [key: string]: string };
    rawResources: { [key: string]: RawResource };
}

function getItems(data: any[]): PartDataInterface {
    const parts: { [key: string]: Part } = {};
    const collectables: { [key: string]: string } = {};
    const rawResources = getRawResources(data);

    data
        .filter((entry: any) => entry.Classes)
        .flatMap((entry: any) => entry.Classes)
        .forEach((entry: any) => {
            // There are two exception products we need to check for and add to the parts list
            if (entry.ClassName === "Desc_NuclearWaste_C") {
                // Note that this part id is NuclearWaste, not Uranium Waste
                parts["NuclearWaste"] = { 
                    name: "Uranium Waste",
                    stackSize: 500, //SS_HUGE
                    isFluid: false,
                    isFicsmas: false,
                };
            } else if (entry.ClassName === "Desc_PlutoniumWaste_C") {
                parts["PlutoniumWaste"] = {
                    name: "Plutonium Waste",
                    stackSize: 500, //SS_HUGE
                    isFluid: false,
                    isFicsmas: false,
                };
            }         
            //These are exception products that aren't produced by mines or extractors, they are raw materials
            if (entry.ClassName === "Desc_Leaves_C") {
                parts["Leaves"] = {
                    name: "Leaves",
                    stackSize: 500, //SS_HUGE
                    isFluid: false,
                    isFicsmas: false,
                };
            } else if (entry.ClassName === "Desc_Wood_C") {
                parts["Wood"] = {
                    name: "Wood",
                    stackSize: 200, //SS_BIG
                    isFluid: false,
                    isFicsmas: false,
                };
            } else if (entry.ClassName === "Desc_Mycelia_C") {
                parts["Mycelia"] = {
                    name: "Mycelia",
                    stackSize: 200, //SS_BIG
                    isFluid: false,
                    isFicsmas: false,
                };
            } else if (entry.ClassName === "Desc_HogParts_C") {
                parts["HogParts"] = {
                    name: "Hog Remains",
                    stackSize: 50, //SS_SMALL
                    isFluid: false,
                    isFicsmas: false,
                };
            } else if (entry.ClassName === "Desc_SpitterParts_C") {
                parts["SpitterParts"] = {
                    name: "Spitter Remains",
                    stackSize: 50, //SS_SMALL
                    isFluid: false,
                    isFicsmas: false,
                };
            } else if (entry.ClassName === "Desc_StingerParts_C") {
                parts["StingerParts"] = {
                    name: "Stinger Remains",
                    stackSize: 50, //SS_SMALL
                    isFluid: false,
                    isFicsmas: false,
                };
            } else if (entry.ClassName === "Desc_HatcherParts_C") {
                parts["HatcherParts"] = {
                    name: "Hatcher Remains",
                    stackSize: 50, //SS_SMALL
                    isFluid: false,
                    isFicsmas: false,
                };
            } else if (entry.ClassName === "Desc_DissolvedSilica_C") {
                // This is a special intermediate alt product
                parts["DissolvedSilica"] = {
                    name: "Dissolved Silica",
                    stackSize: 0, //SS_FLUID
                    isFluid: true,
                    isFicsmas: false,
                };
            } else if (entry.ClassName === "Desc_LiquidOil_C") {
                // This is a special liquid raw material
                parts["LiquidOil"] = {
                    name: "Liquid Oil",
                    stackSize: 0, //SS_FLUID
                    isFluid: true,
                    isFicsmas: false,
                };
            } else if (entry.ClassName === "Desc_Gift_C") {
                // this is a ficsmas collectable
                parts["Gift"] = {
                    name: "FICSMAS Gift",
                    stackSize: 500, //SS_HUGE
                    isFluid: false,
                    isFicsmas: true,
                };
            }
            // Ensures it's a recipe, we only care about items that are produced within a recipe.
            if (!entry.mProducedIn) return;

            if (blacklist.some(building => entry.mProducedIn.includes(building))) return;

            // Check if it's an alternate recipe and skip it for parts
            if (entry.ClassName.startsWith("Recipe_Alternate")) return;

            // Check if it's an unpackage recipe and skip it for parts
            if (entry.mDisplayName.includes("Unpackage")) return;

            // Extract the part name
            const productMatches = [...entry.mProduct.matchAll(/ItemClass=".*?\/Desc_(.*?)\.Desc_.*?",Amount=(\d+)/g)];

            productMatches.forEach(match => {
                const partName = match[1];  // Use the mProduct part name
                let friendlyName = entry.mDisplayName;  // Use the friendly name

                // Remove any text within brackets, including the brackets themselves
                friendlyName = friendlyName.replace(/\s*\(.*?\)/g, '');

                // Extract the product's Desc_ class name so we can find it in the class descriptors to get the stack size
                const productClass = match[0].match(/Desc_(.*?)\.Desc_/)?.[1];

                const classDescriptor = data
                    .flatMap((entry: any) => entry.Classes)
                    .find((entry: any) => entry.ClassName === `Desc_${productClass}_C`);

                // Extract stack size
                const stackSize = stackSizeConvert(classDescriptor?.mStackSize || "SS_UNKNOWN")

                // Check if the part is a collectable (e.g., Power Slug)
                if (isCollectable(entry.mIngredients)) {
                    collectables[partName] = friendlyName;
                } else {
                    parts[partName] = {
                        name: friendlyName,
                        stackSize,
                        isFluid: isFluid(partName),
                        isFicsmas: isFicsmas(entry.mDisplayName),
                    };
                }
            });
        });

    // Sort the parts and collectables by key
    return {
        parts: Object.keys(parts)
            .sort()
            .reduce((sortedObj: { [key: string]: Part }, key: string) => {
                sortedObj[key] = parts[key];
                return sortedObj;
            }, {}),
        collectables: Object.keys(collectables)
            .sort()
            .reduce((sortedObj: { [key: string]: string }, key: string) => {
                sortedObj[key] = collectables[key];
                return sortedObj;
            }, {}),
        rawResources
    };
}

// Function to extract all buildings that produce something
function getProducingBuildings(data: any[]): string[] {
    const producingBuildingsSet = new Set<string>();

    data
        .filter((entry: any) => entry.Classes)
        .flatMap((entry: any) => entry.Classes)
        .forEach((entry: any) => {
            if (entry.mProducedIn) {
                // Updated regex to capture building names inside quotes
                const producedInBuildings = entry.mProducedIn.match(/\/(\w+)\/(\w+)\.(\w+)_C/g)
                    ?.map((building: string) => {
                        const match = RegExp(/\/(\w+)\.(\w+)_C/).exec(building);
                        if (match) {
                            // Remove "build_" prefix if present
                            return match[2].startsWith('Build_') ? match[2].replace('Build_', '').toLowerCase() : match[2].toLowerCase();
                        }
                        return null;
                    })
                    .filter((buildingName: string | null) => buildingName !== null);  // Filter out null values

                if (producedInBuildings) {
                    producedInBuildings.forEach((buildingName: string) => producingBuildingsSet.add(buildingName));
                }
            } else if (entry.ClassName === "Desc_NuclearWaste_C") { 
                producingBuildingsSet.add("nuclearpowerplant");
            }
        });

    return Array.from(producingBuildingsSet);  // Convert Set to an array
}

// Function to extract the power consumption for each producing building
function getPowerConsumptionForBuildings(data: any[], producingBuildings: string[]): { [key: string]: number } {
    const buildingsPowerMap: { [key: string]: number } = {};

    data
        .filter((entry: any) => entry.Classes)
        .flatMap((entry: any) => entry.Classes)
        .forEach((building: any) => {
            if (building.ClassName && building.mPowerConsumption) {
                // Normalize the building name by removing "_C" and lowercasing it
                let buildingName = building.ClassName.replace(/_C$/, '').toLowerCase();
                buildingName = buildingName.startsWith('build_') ? buildingName.replace('build_', '') : buildingName;

                // Only include power data if the building is in the producingBuildings list
                if (producingBuildings.includes(buildingName)) {
                    buildingsPowerMap[buildingName] = parseFloat(building.mPowerConsumption) || 0;
                }
            }
        });

        //Manually add nuclear power plant
        buildingsPowerMap["nuclearpowerplant"] = 0;

    // Finally sort the map by key
    const sortedMap: { [key: string]: number } = {};
    Object.keys(buildingsPowerMap).sort().forEach(key => {
        sortedMap[key] = buildingsPowerMap[key];
    });

    return sortedMap;
}


// If you can read this, you are a wizard. ChatGPT made this, it works, so I won't question it!
function getRecipes(
    data: any[],
    producingBuildings: { [key: string]: number }
): Recipe[] {
    const recipes: any[] = [];

    data
        .filter((entry: any) => entry.Classes)
        .flatMap((entry: any) => entry.Classes)
        .filter((recipe: any) => {
            if (!recipe.mProducedIn) return false;
            if (blacklist.every(building => recipe.mProducedIn.includes(building))) return false;

            // Extract all producing buildings
            const rawBuildingKeys = recipe.mProducedIn.match(/\/([^/]+)\./g);

            if (!rawBuildingKeys) {
                return false;
            }

            // Process all buildings and check if any match the producingBuildings map
            const validBuilding = rawBuildingKeys.some((rawBuilding: string) => {
                const buildingKey = rawBuilding.replace(/\//g, '').replace(/\./g, '').toLowerCase().replace('build_', '');
                return producingBuildings[buildingKey];
            })


            // // Log for debugging NobeliskGas specifically
            // if (recipe.ClassName === "Recipe_NobeliskGas_C") {
            //     console.log("Recipe:", recipe);
            //     console.log("Raw Building Keys:", rawBuildingKeys);
            //     console.log("Valid Building:", validBuilding);
            // }

            return validBuilding;
        })
        .forEach((recipe: any) => {
            const ingredients = recipe.mIngredients
                ? recipe.mIngredients
                    .match(/ItemClass=".*?\/Desc_(.*?)\.Desc_.*?",Amount=(\d+)/g)
                    ?.map((ingredientStr: string) => {
                        const match = RegExp(/Desc_(.*?)\.Desc_.*?,Amount=(\d+)/).exec(ingredientStr);
                        if (match) {
                            const partName = match[1];
                            let amount = parseInt(match[2], 10);

                            if (isFluid(partName)) {
                                amount = amount / 1000;
                            }

                            const perMin = recipe.mManufactoringDuration && amount > 0 ? (60 / parseFloat(recipe.mManufactoringDuration)) * amount : 0;

                            return {
                                part: partName,
                                amount,
                                perMin
                            };
                        }
                        return null;
                    })
                    .filter((ingredient: any) => ingredient !== null)
                : [];

            // Parse mProduct to extract all products
            const productMatches = [...recipe.mProduct.matchAll(/ItemClass=".*?\/Desc_(.*?)\.Desc_.*?",Amount=(\d+)/g)];

            let products: { part: string, amount: number, perMin: number, isByProduct?: boolean }[] = [];
            productMatches.forEach(match => {
                const productName = match[1];
                let amount = parseInt(match[2], 10);

                if (isFluid(productName)) {
                    amount = amount / 1000;  // Divide by 1000 for liquid/gas amounts
                }

                const perMin = recipe.mManufactoringDuration && amount > 0 ? (60 / parseFloat(recipe.mManufactoringDuration)) * amount : 0;

                products.push({
                    part: productName,
                    amount,
                    perMin,
                    isByProduct: products.length > 0
                });
            });

            // Extract all producing buildings
            const producedInMatches = recipe.mProducedIn.match(/\/(\w+)\/(\w+)\.(\w+)_C/g) || [];

            // Filter and normalize building names, excluding invalid entries
            const validBuildings = producedInMatches
                .map((building: { match: (arg0: RegExp) => string[]; }) => building.match(/\/(\w+)\.(\w+)_C/)?.[2]?.replace(/build_/gi, '').toLowerCase())
                .filter((building: string) => building && !['bp_workbenchcomponent', 'bp_workshopcomponent', 'factorygame'].includes(building));

            // Calculate power per building and choose the most relevant one
            let powerPerBuilding = null;
            let selectedBuilding: string | number = '';

            if (validBuildings.length > 0) {
                // Sum up power for all valid buildings
                powerPerBuilding = validBuildings.reduce((totalPower: number, building: string | number) => {
                    if (producingBuildings[building]) {
                        const buildingPower = producingBuildings[building]
                        //const buildingPower = Object.values(products).reduce(
                        //     // Calculate power for this product amount
                        //     (total, product) => total + producingBuildings[building],
                        //     0
                        // );
                        selectedBuilding = selectedBuilding || building; // Set the first valid building as selected
                        return totalPower + buildingPower; // Add power for this building
                    }
                    return totalPower;
                }, 0);
            }

            // Create building object with the selected building and calculated power
            const building = {
                name: selectedBuilding || '', // Use the first valid building, or empty string if none
                power: powerPerBuilding || 0, // Use calculated power or 0
            };


            recipes.push({
                id: recipe.ClassName.replace("Recipe_", "").replace(/_C$/, ""),
                displayName: recipe.mDisplayName,
                ingredients,
                products,
                building,
                isAlternate: recipe.mDisplayName.includes("Alternate"),
                isFicsmas: isFicsmas(recipe.mDisplayName)
            });
        });

    // Manually add Nuclear waste recipes
    recipes.push({
        id: "NuclearWaste",
        displayName: "Uranium Waste",
        ingredients: [{ part: 'NuclearFuelRod', amount: 1, perMin: 0.2 }, { part: 'Water', amount: 1200, perMin: 240 }],
        products: [{ part: "NuclearWaste", amount: 1, perMin: 50 }],
        building: { name: "nuclearpowerplant", power: 0 },
        isAlternate: false,
        isFicsmas: false
    });
    recipes.push({
        id: "PlutoniumWaste",
        displayName: "Plutonium Waste",
        ingredients: [{ part: 'PlutoniumFuelRod', amount: 1, perMin: 0.1 }, { part: 'Water', amount: 2400, perMin: 240 }],
        products: [{ part: "PlutoniumWaste", amount: 1, perMin: 10 }],
        building: { name: "nuclearpowerplant", power: 0 },
        isAlternate: false,
        isFicsmas: false
    });

    return recipes.sort((a, b) => a.displayName.localeCompare(b.displayName));
}

interface RawResource {
    name: string;
    limit: number;
}

// Function to extract raw resources from the game data
function getRawResources(data: any[]): { [key: string]: RawResource } {
    const rawResources: { [key: string]: RawResource } = {};
    const limits: { [key: string]: number } = {
        "Coal": 42300,
        "LiquidOil": 12600,
        "NitrogenGas": 12000,
        "OreBauxite": 12300,
        "OreCopper": 36900,
        "OreGold": 15000,
        "OreIron": 92100,
        "OreUranium": 2100,
        "RawQuartz": 13500,
        "SAM": 10200,
        "Stone": 69900,
        "Sulfur": 10800,
        "Water": 9007199254740991,
    }

    data
        .filter((entry: any) => entry.NativeClass === "/Script/CoreUObject.Class'/Script/FactoryGame.FGResourceDescriptor'")
        .flatMap((entry: any) => entry.Classes)
        .forEach((resource: any) => {
            const className = resource.ClassName
                .replace('Desc_', '')
                .replace(/_C$/, '')
                .toString();
            const displayName = resource.mDisplayName;

            const data = {
                name: displayName,
                limit: limits[className] || 0
            }

            if (className && displayName) {
                rawResources[className] = data;
            }
        });

    return rawResources;
}

function fixItemNames(items: PartDataInterface): void {
    // Go through the item names and do some manual fixes, e.g. renaming "Residual Plastic" to "Plastic"
    const fixItems: Record<string, string> = {
        "AlienProtein": "Alien Protein",
        "CompactedCoal": "Compacted Coal",
        "DarkEnergy": "Dark Matter Residue",
        "HeavyOilResidue": "Heavy Oil Residue",
        "LiquidFuel": "Fuel",
        "Plastic": "Plastic",
        "PolymerResin": "Polymer Resin",
        "Rubber": "Rubber",
        "Snow": "Snow",
        "Water": "Water",
    };

    for (const search of Object.keys(fixItems)) {
        if (items.parts[search]) {
            items.parts[search].name = fixItems[search];
        }
    }
}

function removeRubbishItems(items: PartDataInterface, recipes: Recipe[]): void {
    // Create a Set to store all product keys from recipes
    const recipeProducts = new Set();

    // Loop through each recipe to collect all product keys
    recipes.forEach(recipe => {
        recipe.products.forEach(product => {
            recipeProducts.add(product.part);
        });
        recipe.ingredients.forEach(ingredient => {
            recipeProducts.add(ingredient.part);
        });
    });

    // Loop through each item in items.parts and remove any entries that do not exist in recipeProducts
    Object.keys(items.parts).forEach(part => {
        if (!recipeProducts.has(part)) {
            //console.log(`Removing rubbish item: ${part}`);
            delete items.parts[part];
        }
    });
}

function stackSizeConvert(stackSize: string) {
    // Convert e.g. SS_HUGE to 500
    switch (stackSize) {
        case "SS_HUGE":
            return 500;
        case "SS_BIG":
            return 200;
        case "SS_MEDIUM":
            return 100;
        case "SS_SMALL":
            return 50;
        default:
            return 0;
    }
}

function fixTurbofuel(items: PartDataInterface, recipes: Recipe[]): void {
    // Rename the current "Turbofuel" which is actually "Packaged Turbofuel"
    items.parts["PackagedTurboFuel"] = items.parts["TurboFuel"];

    // Add the actual "Turbofuel" as a new item
    items.parts["LiquidTurboFuel"] = {
        name: "Turbofuel",
        stackSize: 0,
        isFluid: true,
        isFicsmas: false,
    };

    // Now we need to go through the recipes and wherever "TurboFuel" is mentioned, it needs to be changed to "PackagedTurbofuel"
    recipes.forEach(recipe => {
        recipe.products.forEach(product => {
            if (product.part === "TurboFuel") {
                product.part = "PackagedTurboFuel";
            }
        });

        recipe.ingredients.forEach(ingredient => {
            if (ingredient.part === "TurboFuel") {
                ingredient.part = "PackagedTurboFuel";
            }
        });
    });
}

// Central function to process the file and generate the output
async function processFile(inputFile: string, outputFile: string) : Promise<{ buildings: { [key: string]: number }; items: PartDataInterface; recipes: Recipe[] } | undefined> {
    try {
        const fileContent = await readFileAsUtf8(inputFile);
        const cleanedContent = cleanInput(fileContent);
        const data = JSON.parse(cleanedContent);

        // Get parts
        const items = getItems(data);
        fixItemNames(items);

        // Get an array of all buildings that produce something
        const producingBuildings = getProducingBuildings(data);

        // Get power consumption for the producing buildings
        const buildings = getPowerConsumptionForBuildings(data, producingBuildings);

        // Pass the producing buildings with power data to getRecipes to calculate perMin and powerPerProduct
        const recipes = getRecipes(data, buildings);

        removeRubbishItems(items, recipes);
        fixTurbofuel(items, recipes);

        // Since we've done some manipulation of the items data, re-sort it
        const sortedItems: { [key: string]: Part } = {};
        Object.keys(items.parts).sort().forEach(key => {
            sortedItems[key] = items.parts[key];
        });
        items.parts = sortedItems;

        // Construct the final JSON object
        const finalData = {
            buildings,
            items,
            recipes
        };

        // Write the output to the file
        await fs.writeJson(path.resolve(outputFile), finalData, {spaces: 4});
        console.log(`Processed parts, buildings, and recipes have been written to ${outputFile}.`);

        return finalData;
    } catch (error) {
        if (error instanceof Error) {
            console.error(`Error processing file: ${error.message}`);
        } else {
            console.error(`Error processing file: ${error}`);
        }
    }
}

// Export processFile for use
export {processFile}
