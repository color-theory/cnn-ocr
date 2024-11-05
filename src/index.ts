/**
 * @fileoverview Entry point of the application
 * @packageDocumentation
 * @module index
 * @preferred
 * 
 */

import ocr from './app';

// Run the OCR function with the image path provided as an argument
(async () => {
	const start = Date.now();
	const args = process.argv.slice(2);
	const spellCheck = args[0] === '--no-spell' ? false : true;
	const imagePath = spellCheck ? args[0] : args[1];

	await ocr(imagePath, spellCheck);
	const end = Date.now();
	console.log(`Execution time: ${end - start}ms`);
})();
