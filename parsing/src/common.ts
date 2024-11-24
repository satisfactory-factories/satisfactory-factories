// Blacklist for excluding items produced by the Build Gun
const blacklist = [
    "/Game/FactoryGame/Equipment/BuildGun/BP_BuildGun.BP_BuildGun_C",
];

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
        displayName.includes("Gift") ||
        displayName.includes("Snow") ||
        displayName.includes("Candy") ||
        displayName.includes("Fireworks");
}

// Export various items for use
export {blacklist,isFluid,isFicsmas}