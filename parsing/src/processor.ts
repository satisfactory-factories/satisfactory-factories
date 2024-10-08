import * as fs from 'fs-extra';
import * as path from 'path';
import * as iconv from 'iconv-lite';

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

// Function to extract parts, moving collectables to specialParts
function getParts(
    data: any[])
    : {
        parts: { [key: string]: string },
        collectables: { [key: string]: string },
        rawResources: { [key: string]: RawResource }
    } {
    const parts: { [key: string]: string } = {};
    const collectables: { [key: string]: string } = {};
    const rawResources = getRawResources(data);

    data
        .filter((entry: any) => entry.Classes)
        .flatMap((entry: any) => entry.Classes)
        .forEach((entry: any) => {
            if (!entry.mProducedIn) return;
            if (blacklist.some(building => entry.mProducedIn.includes(building))) return;

            // Check if it's an alternate recipe and skip it for parts
            if (entry.ClassName.startsWith("Recipe_Alternate")) return;

            // Check if it's an unpackage recipe and skip it for parts
            if (entry.mDisplayName.includes("Unpackage")) return;

            // Extract the part name
            const productMatches = entry.mProduct
                ?.match(/ItemClass=".*?\/Desc_(.*?)\.Desc_.*?",Amount=(\d+)/);

            if (productMatches) {
                const partName = productMatches[1];  // Use the mProduct part name
                let friendlyName = entry.mDisplayName;  // Use the friendly name

                // Remove any text within brackets, including the brackets themselves
                friendlyName = friendlyName.replace(/\s*\(.*?\)/g, '');

                // Check if the part is a collectable (e.g., Power Slug)
                if (isCollectable(entry.mIngredients)) {
                    collectables[partName] = friendlyName;
                } else {
                    parts[partName] = friendlyName;
                }
            }
        });

    // Sort the parts and collectables by key
    return {
        parts: Object.keys(parts)
            .sort()
            .reduce((sortedObj: { [key: string]: string }, key: string) => {
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
                const producedInBuildings = entry.mProducedIn.match(/\/([A-Za-z0-9_]+)\/([A-Za-z0-9_]+)\.([A-Za-z0-9_]+)_C/g)
                    ?.map((building: string) => {
                        const match = building.match(/\/([A-Za-z0-9_]+)\.([A-Za-z0-9_]+)_C/);
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

    return buildingsPowerMap;
}

// Helper function to check if a recipe is likely to be liquid based on building type and amount
function isLikelyFluid(building: string, amount: number, productName: string): boolean {
    const fluidBuildings = ['build_waterpump', 'build_oilrefinery', 'build_packager', 'build_oilpump', 'build_blender'];
    const gasProducts = ['nitrogengas', 'oxygengas', 'heliumgas'];  // Add any gas product names here
    const isFluidBuilding = fluidBuildings.includes(building.toLowerCase());
    const isGasProduct = gasProducts.includes(productName.toLowerCase());

    return (isFluidBuilding && amount > 100) || isGasProduct;
}

function getRecipes(data: any[], producingBuildings: { [key: string]: number }): any[] {
    const recipes: any[] = [];
    const uniqueProductsSet = new Set<string>();

    data
        .filter((entry: any) => entry.Classes)
        .flatMap((entry: any) => entry.Classes)
        .filter((recipe: any) => {
            if (!recipe.mProducedIn) return false;
            if (blacklist.some(building => recipe.mProducedIn.includes(building))) return false;

            // Check if there's a building in the producingBuildings map that matches the recipe's producing building
            const rawBuildingKey = recipe.mProducedIn.match(/\/([^\/]+)\./g);

            if (!rawBuildingKey) {
              return false;
            }

            // Check the array for "Build_", if one is found remove the build prefix
            const buildingKey = rawBuildingKey[0].replace(/\//g, '').replace(/\./g, '').toLowerCase().replace('build_', '');

            if (producingBuildings[buildingKey]) {
              console.log('Found building in producingBuildings map:', buildingKey);
                return true;
            }
        })
        .forEach((recipe: any) => {
            const ingredients = recipe.mIngredients
                ? recipe.mIngredients
                    .match(/ItemClass=".*?\/Desc_(.*?)\.Desc_.*?",Amount=(\d+)/g)
                    ?.map((ingredientStr: string) => {
                        const match = ingredientStr.match(/Desc_(.*?)\.Desc_.*?",Amount=(\d+)/);
                        if (match) {
                            const partName = match[1];
                            let amount = parseInt(match[2], 10);
                            // Check if this is a likely liquid or gas based on building and amount
                            const producedIn = recipe.mProducedIn.match(/\/([^\/]+)\./g)
                                ?.map((building: string) => building.replace(/\//g, '').replace(/\./g, '').toLowerCase())[0] || '';

                            if (isLikelyFluid(producedIn, amount, partName)) {
                                amount = amount / 1000;  // Divide by 1000 for liquids and gases
                            }
                            return { [partName]: amount };
                        }
                        return null;
                    })
                    .filter((ingredient: any) => ingredient !== null)
                : [];

            // Parse mProduct to extract both the product and byProduct
            const productMatches = recipe.mProduct
                ?.match(/ItemClass=".*?\/Desc_(.*?)\.Desc_.*?",Amount=(\d+)/);

            let product = {};
            let byProduct = {};
            let productAmount = 0;

            if (productMatches && productMatches.length > 0) {
                // Handle the first product
                const primaryProductMatch = productMatches[0].match(/Desc_(.*?)\.Desc_.*?",Amount=(\d+)/);
                if (primaryProductMatch) {
                    const productName = primaryProductMatch[1];
                    productAmount = parseInt(primaryProductMatch[2], 10);

                    const producedIn = recipe.mProducedIn.match(/\/([^\/]+)\./g)
                        ?.map((building: string) => building.replace(/\//g, '').replace(/\./g, '').toLowerCase())[0] || '';

                    if (isLikelyFluid(producedIn, productAmount, productName)) {
                        productAmount = productAmount / 1000;  // Divide by 1000 for liquid/gas amounts
                    }

                    product = { [productName]: productAmount };

                    // Add to uniqueProductsSet to ensure unique products in parts
                    uniqueProductsSet.add(productName);
                }

                // Handle the second product as byProduct, if present
                if (productMatches.length > 1) {
                    const byProductMatch = productMatches[1].match(/Desc_(.*?)\.Desc_.*?",Amount=(\d+)/);
                    if (byProductMatch) {
                        const byProductName = byProductMatch[1];
                        let byProductAmount = parseInt(byProductMatch[2], 10);
                        byProduct = { [byProductName]: byProductAmount };
                    }
                }
            }

            // Ensure primary product's amount is a number
            const perMin = recipe.mManufactoringDuration && productAmount > 0 ? (60 / parseFloat(recipe.mManufactoringDuration)) * productAmount : 0;

            // Handle multiple building power values and remove "build_" prefix
            const producedIn = recipe.mProducedIn
                .match(/\/([^\/]+)\./g)
                ?.map((building: string) => {
                    let buildingKey = building.replace(/\//g, '').replace(/\./g, '').toLowerCase();
                    // Remove "build_" prefix if present
                    if (buildingKey.startsWith('build_')) {
                        buildingKey = buildingKey.replace('build_', '');
                    }
                    return buildingKey;
                })
                .filter((building: string) => building !== "factorygame") || [];

            // Filter out redundant buildings like "bp_workbenchcomponent" and "factorygame"
            const powerPerBuilding = producedIn
                .filter((building: string) => !['bp_workbenchcomponent', 'factorygame'].includes(building)) // Remove entries with these buildings
                .map((building: string) => {
                    const buildingPower = producingBuildings[building] || 0;  // Get building power from the producingBuildings map, default to 0
                    return {
                        building: building,
                        powerPerBuilding: productAmount > 0 ? buildingPower / productAmount : 0
                    };
                });

            const isAlternate = recipe.mDisplayName.includes("Alternate");

            recipes.push({
                id: recipe.ClassName.replace("Recipe_", "").replace(/_C$/, ""),
                displayName: recipe.mDisplayName,
                ingredients,
                product,        // Singular primary product
                byProduct,      // Singular byProduct (if any)
                perMin,         // Add perMin for the primary product
                producedIn,
                powerPerBuilding,
                isAlternate
            });
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
    const limits: {[key: string]: number } = {
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

// Central function to process the file and generate the output
async function processFile(inputFile: string, outputFile: string) {
    try {
        const fileContent = await readFileAsUtf8(inputFile);
        const cleanedContent = cleanInput(fileContent);
        const data = JSON.parse(cleanedContent);

        // Get parts
        const items = getParts(data);

        // Get an array of all buildings that produce something
        const producingBuildings = getProducingBuildings(data);

        // Get power consumption for the producing buildings
        const buildingsPowerMap = getPowerConsumptionForBuildings(data, producingBuildings);

        // Pass the producing buildings with power data to getRecipes to calculate perMin and powerPerProduct
        const recipes = getRecipes(data, buildingsPowerMap);

        // Construct the final JSON object
        const finalData = {
            buildings: buildingsPowerMap,  // Use buildingsPowerMap for building info
            items,
            recipes
        };

        // Write the output to the file
        await fs.writeJson(path.resolve(outputFile), finalData, { spaces: 4 });
        console.log(`Processed parts, buildings, and recipes have been written to ${outputFile}.`);
    } catch (error) {
        if (error instanceof Error) {
            console.error(`Error processing file: ${error.message}`);
        } else {
            console.error(`Error processing file: ${error}`);
        }
    }
}

// Export processFile for use
export { processFile };