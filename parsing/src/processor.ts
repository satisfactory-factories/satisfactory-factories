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
const blacklist = ["/Game/FactoryGame/Equipment/BuildGun/BP_BuildGun.BP_BuildGun_C"];
const workshopComponentPath = "/Game/FactoryGame/Buildable/-Shared/WorkBench/BP_WorkshopComponent.BP_WorkshopComponent_C";

// Function to extract parts
function getParts(data: any[]): { [key: string]: string } {
    const parts: { [key: string]: string } = {};

    data
        .filter((entry: any) => entry.Classes)
        .flatMap((entry: any) => entry.Classes)
        .forEach((entry: any) => {
            if (!entry.mProducedIn) return;
            if (blacklist.some(building => entry.mProducedIn.includes(building))) return;

            // Check if it's an alternate recipe and skip it for parts
            if (entry.ClassName.startsWith("Recipe_Alternate")) return;

            const producedInBuildings = entry.mProducedIn.match(/"([^"]+)"/g)?.map((building: string) => building.replace(/"/g, ''));
            if (producedInBuildings && producedInBuildings.length === 1 && producedInBuildings[0] === workshopComponentPath) return;

            const partName = entry.ClassName.replace("Desc_", "").replace(/_C$/, "").replace("Recipe_", "");
            const displayName = entry.mDisplayName;
            if (!parts[partName]) parts[partName] = displayName;
        });

    // Sort the parts by key
    return Object.keys(parts)
      .sort()
      .reduce((sortedObj: { [key: string]: string }, key: string) => {
          sortedObj[key] = parts[key];
          return sortedObj;
      }, {});
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
function isLikelyLiquid(building: string, amount: number): boolean {
    const fluidBuildings = ['build_waterpump', 'build_oilrefinery', 'build_packager', 'build_oilpump', 'build_blender'];
    return fluidBuildings.includes(building.toLowerCase()) && amount > 100;
}

// Function to extract recipes
function getRecipes(data: any[], producingBuildings: { [key: string]: number }): any[] {
    const recipes: any[] = [];
    data
        .filter((entry: any) => entry.Classes)
        .flatMap((entry: any) => entry.Classes)
        .filter((recipe: any) => {
            if (!recipe.mProducedIn) return false;
            if (blacklist.some(building => recipe.mProducedIn.includes(building))) return false;
            const producedInBuildings = recipe.mProducedIn.match(/"([^"]+)"/g)?.map((building: string) => building.replace(/"/g, ''));
            return !(producedInBuildings && producedInBuildings.length === 1 && producedInBuildings[0] === workshopComponentPath);

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
                            // Check if this is a likely liquid based on building and amount
                            const producedIn = recipe.mProducedIn.match(/\/([^\/]+)\./g)
                                ?.map((building: string) => building.replace(/\//g, '').replace(/\./g, '').toLowerCase())[0] || '';

                            if (isLikelyLiquid(producedIn, amount)) {
                                amount = amount / 100;  // Divide by 100 for liquid amounts
                            }
                            return { [partName]: amount };
                        }
                        return null;
                    })
                    .filter((ingredient: any) => ingredient !== null)
                : [];

            // Parse mProduct to extract the single product and byProduct
            const productMatch = recipe.mProduct
                ?.match(/ItemClass=".*?\/Desc_(.*?)\.Desc_.*?",Amount=(\d+)/);

            let product = {};
            let byProduct = {};

            if (productMatch) {
                const productName = productMatch[1];
                let productAmount = parseInt(productMatch[2], 10);

                const producedIn = recipe.mProducedIn.match(/\/([^\/]+)\./g)
                    ?.map((building: string) => building.replace(/\//g, '').replace(/\./g, '').toLowerCase())[0] || '';

                if (isLikelyLiquid(producedIn, productAmount)) {
                    productAmount = productAmount / 1000;  // Divide by 1000 for liquid amounts
                }

                product = { [productName]: productAmount };

                // Check for byProducts in the case where more than one product exists
                const byProductMatch = recipe.mProduct
                    ?.match(/ItemClass=".*?\/Desc_(.*?)\.Desc_.*?",Amount=(\d+)/g)?.[1];
                if (byProductMatch) {
                    const byProductName = byProductMatch[1];
                    let byProductAmount = parseInt(byProductMatch[2], 10);
                    byProduct = { [byProductName]: byProductAmount };
                }
            }

            // Ensure primary product's amount is a number
            const productAmount = typeof Object.values(product)[0] === 'number' ? Object.values(product)[0] as number : 0;

            // Calculate perMin for the primary product using the formula: perMin = (60 / duration) * productAmount
            const duration = parseFloat(recipe.mManufactoringDuration) || 0;  // Default to 0 if undefined
            const perMin = duration > 0 ? (60 / duration) * productAmount : 0;

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
                }) || [];

            // Filter out redundant buildings like "bp_workbenchcomponent" and "factorygame"
            const powerPerBuilding = producedIn
                .map((building: string) => {
                    const buildingPower = producingBuildings[building] || 0;  // Get building power from the producingBuildings map, default to 0
                    return {
                        building: building,
                        powerPerBuilding: perMin > 0 ? buildingPower / perMin : 0
                    };
                })
                .filter((item: { building: string }) => !['bp_workbenchcomponent', 'factorygame'].includes(item.building));  // Remove entries with these buildings

            recipes.push({
                id: recipe.ClassName.replace("Recipe_", "").replace(/_C$/, ""),
                displayName: recipe.mDisplayName,
                ingredients,
                product,        // Singular primary product
                byProduct,      // Singular byProduct (if any)
                perMin,         // Add perMin for the primary product
                producedIn,
                powerPerBuilding  // Renamed to powerPerBuilding
            });
        });
    return recipes;
}

// Central function to process the file and generate the output
async function processFile(inputFile: string, outputFile: string) {
    try {
        const fileContent = await readFileAsUtf8(inputFile);
        const cleanedContent = cleanInput(fileContent);
        const data = JSON.parse(cleanedContent);

        // Get parts
        const parts = getParts(data);

        // Get an array of all buildings that produce something
        const producingBuildings = getProducingBuildings(data);

        // Get power consumption for the producing buildings
        const buildingsPowerMap = getPowerConsumptionForBuildings(data, producingBuildings);

        // Pass the producing buildings with power data to getRecipes to calculate perMin and powerPerProduct
        const recipes = getRecipes(data, buildingsPowerMap);

        // Construct the final JSON object
        const finalData = {
            buildings: buildingsPowerMap,  // Use buildingsPowerMap for building info
            parts,
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
