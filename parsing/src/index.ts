import {processFile } from './processor';

// Get command line arguments for input and output files
const [inputFile, outputFile] = process.argv.slice(2);

if (!inputFile || !outputFile) {
    console.error('Usage: node dist/index.js <input-file> <output-file>');
    process.exit(1);
}

// Run the recipe processing
export const processing = processFile(inputFile, outputFile).then(() => {
    console.log('Processing complete');
});
