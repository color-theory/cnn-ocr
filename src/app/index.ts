/**
 * This is the main component of the application.
 * @param image - The image to be processed
 * @returns The text extracted from the image
 */
import { loadImage, Image } from 'canvas';
import { createAndLoadCanvas, convertToGreyscale, prepareLine, prepareSegment, invertIfDarkBackground } from './preprocess';
import { getCharacterSegments, getLineSegments } from './extraction';
import { vectorSize } from './config';
import { predictCharacters } from './model';
import { binarize } from './preprocess/otsu';

function insertSpaces(prediction: string, wordBoundaries: number[]) {
    let result = '';
    for (let i = 0; i < prediction.length; i++) {
        result += prediction[i];
        if (wordBoundaries.includes(i)) {
            result += ' ';
        }
    }
    return result;
}

export const preprocessImage = (image: Image) => {
	const { canvas, ctx } = createAndLoadCanvas(image);
	convertToGreyscale(canvas, ctx);
	invertIfDarkBackground(canvas, ctx);
 	binarize(canvas, ctx);
	return { canvas, ctx };
};

const ocr = async (imagePath: string, spellCheck: boolean) => {
    const image = await loadImage(imagePath);
	const { canvas, ctx } = preprocessImage(image);

	const lines = getLineSegments(canvas, ctx);
	console.log(`Found ${lines.length} lines. Analyzing...\n`);
    
    let outputText = '';
	for (const line of lines) {
		const { lineCanvas, lineCtx } = prepareLine(canvas, line, vectorSize);
		const segments = getCharacterSegments(lineCanvas, lineCtx);

		let segmentIndex = 0;
		let lineResults = "";

		let imagestoPredict = [];
		let spaceLocations = [];
		for (const segment of segments) {
			if (segment.type == 'space') {
				spaceLocations.push(segmentIndex-1);
				continue;
			};
			if (segment.type == 'gap') {
				continue;
			}
			segmentIndex++;
			const segmentImage = prepareSegment(lineCanvas, segment);
			
            imagestoPredict.push(segmentImage);
			
		};
		lineResults += await predictCharacters(imagestoPredict) + "\n";
			
		const spacedLines = insertSpaces(lineResults, spaceLocations);
		outputText += spacedLines;
		process.stdout.write(spacedLines);
	};
	// if (spellCheck) {
	// 	console.log("\nSending text to spellcheck server: \n");
	// 	outputText = quickFilter(outputText);
	// 	outputText = await getCorrectedText(outputText);
	// }
	return outputText;
};

export default ocr;
