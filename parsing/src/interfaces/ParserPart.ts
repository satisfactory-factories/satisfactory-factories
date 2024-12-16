export interface ParserPart {
    name: string;
    stackSize: number;
    isFluid: boolean;
    isFicsmas: boolean;
    energyGeneratedInMJ: number;
}

export interface ParserItemDataInterface {
    parts: { [key: string]: ParserPart };
    rawResources: { [key: string]: ParserRawResource };
}

export interface ParserRawResource {
    name: string;
    limit: number;
}