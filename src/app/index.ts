/**
 * This is the main component of the application.
 * @param image - The image to be processed
 * @returns The text extracted from the image
 */
import { loadImage, Image } from 'canvas';
import { createAndLoadCanvas, convertToGreyscale, cropToBoundingBox, prepareLine, prepareSegment, pad, invertIfDarkBackground } from './preprocess';
import { getCharacterSegments, getLineSegments, getBounds } from './extraction';
import { vectorSize } from './config';
import { loadModel, predictCharacter } from './model';
import { binarize } from './preprocess/otsu';
import { getCorrectedText, quickFilter } from './postprocess';

export const preprocessImage = (image: Image) => {
	const { canvas, ctx } = createAndLoadCanvas(image);
	convertToGreyscale(canvas, ctx);
	invertIfDarkBackground(canvas, ctx);
 	binarize(canvas, ctx);
	return { canvas, ctx };
};

const ocr = async (imagePath: string, spellCheck: boolean) => {
    const model = await loadModel();
	
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

		for (const segment of segments) {
			segmentIndex++;
			if (segment.type == 'space') {
				lineResults += ' ';
				continue;
			};
			if (segment.type == 'gap') {
				continue;
			}

			const segmentImage = prepareSegment(lineCanvas, segment, vectorSize);
            lineResults += await predictCharacter(model, segmentImage);
			process.stdout.write(`\r${lineResults}`);
		};
		process.stdout.write(`\r${lineResults}\n`);
        outputText += lineResults + '\n';
	};
	if (spellCheck) {
		console.log("\nSending text to spellcheck server: \n");
		outputText = quickFilter(outputText);
		outputText = await getCorrectedText(outputText);
	}
	console.log(outputText)
	return outputText;
};

export default ocr;
