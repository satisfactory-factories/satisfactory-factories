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

// Function to map game building class names to human-readable names
const buildingMap: { [key: string]: string } = {
    "AssemblerMk1": "assembler",
    "ConstructorMk1": "constructor",
    "ManufacturerMk1": "manufacturer",
    // Add other mappings as needed
};

function mapProducedIn(buildingClass: string): string {
    const matchedBuilding = buildingClass.match(/\/(.*?)\./);
    if (matchedBuilding) {
        const buildingKey = matchedBuilding[1]?.split('/').pop();  // Ensure buildingKey is defined
        if (buildingKey) {
            return buildingMap[buildingKey] || buildingKey.toLowerCase();
        }
    }
    return buildingClass;
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
    return parts;
}

// Function to extract recipes
function getRecipes(data: any[], parts: { [key: string]: string }): any[] {
    const recipes: any[] = [];
    data
        .filter((entry: any) => entry.Classes)
        .flatMap((entry: any) => entry.Classes)
        .filter((recipe: any) => {
            if (!recipe.mProducedIn) return false;
            if (blacklist.some(building => recipe.mProducedIn.includes(building))) return false;
            const producedInBuildings = recipe.mProducedIn.match(/"([^"]+)"/g)?.map((building: string) => building.replace(/"/g, ''));
            if (producedInBuildings && producedInBuildings.length === 1 && producedInBuildings[0] === workshopComponentPath) return false;
            return true;
        })
        .forEach((recipe: any) => {
            const ingredients = recipe.mIngredients
                ? recipe.mIngredients
                    .match(/ItemClass=".*?\/Desc_(.*?)\.Desc_.*?",Amount=(\d+)/g)
                    ?.map((ingredientStr: string) => {
                        const match = ingredientStr.match(/Desc_(.*?)\.Desc_.*?",Amount=(\d+)/);
                        if (match) {
                            const partName = match[1];
                            const amount = parseInt(match[2], 10);
                            return { [partName]: amount };
                        }
                        return null;
                    })
                    .filter((ingredient: any) => ingredient !== null)
                : [];

            const producedIn = recipe.mProducedIn
                .match(/\/(.*?)\./g)
                ?.map((building: string) => mapProducedIn(building)) || [];

            // Extract the product of the recipe
            const productMatch = recipe.mProduct?.match(/ItemClass=".*?\/Desc_(.*?)\.Desc_.*?",Amount=(\d+)/);
            const product = productMatch ? { [productMatch[1]]: parseInt(productMatch[2], 10) } : {};
            const productAmount = parseInt(productMatch?.[2] || "1", 10); // Default to 1 if no product amount is given

            // Calculate perMin using the formula: perMin = (60 / duration) * productAmount
            const duration = parseFloat(recipe.mManufactoringDuration) || 0;  // Default to 0 if undefined
            const perMin = duration > 0 ? (60 / duration) * productAmount : 0;

            recipes.push({
                id: recipe.ClassName.replace("Recipe_", "").replace(/_C$/, ""),
                displayName: recipe.mDisplayName,
                ingredients,
                producedIn,
                product,
                perMin  // Add perMin to the recipe
            });
        });
    return recipes;
}
// Function to extract unique buildings
function getBuildings(data: any[]): Set<string> {
    const buildingsSet = new Set<string>();
    data
        .filter((entry: any) => entry.Classes)
        .flatMap((entry: any) => entry.Classes)
        .forEach((recipe: any) => {
            if (recipe.mProducedIn) {
                const producedIn = recipe.mProducedIn.match(/\/(.*?)\./g)
                    ?.map((building: string) => mapProducedIn(building)) || [];
                producedIn.forEach((building: string) => buildingsSet.add(building));  // Explicitly define type as string
            }
        });
    return buildingsSet;
}

// Central function to process the file and generate the output
async function processFile(inputFile: string, outputFile: string) {
    try {
        const fileContent = await readFileAsUtf8(inputFile);
        const cleanedContent = cleanInput(fileContent);
        const data = JSON.parse(cleanedContent);

        // Get parts, recipes, and buildings
        const parts = getParts(data);
        const recipes = getRecipes(data, parts);
        const buildings = Array.from(getBuildings(data));

        // Construct the final JSON object
        const finalData = {
            buildings,
            parts,
            recipes
        };

        // Write the output to the file
        await fs.writeJson(path.resolve(outputFile), finalData, { spaces: 4 });
        console.log(`Processed parts, buildings, and recipes have been written to ${outputFile}.`);
    } catch (error) {
        if (error instanceof Error) {  // Type guard check for 'unknown' type
            console.error(`Error processing file: ${error.message}`);
        } else {
            console.error(`Error processing file: ${error}`);
        }
    }
}

// Export processFile for use
export { processFile };
