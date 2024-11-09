/**
 * This is the main component of the application.
 * @param image - The image to be processed
 * @returns The text extracted from the image
 */
import { loadImage, Image } from "canvas";
import fs from "fs";
import {
  createAndLoadCanvas,
  convertToGreyscale,
  prepareLine,
  prepareSegment,
  invertIfDarkBackground,
  cropToHorizontalBounds,
} from "./preprocess";
import { getCharacterSegments, getLineSegments } from "./extraction";
import { vectorSize } from "./config";
import { predictCharacters } from "./model";
import { binarize } from "./preprocess/otsu";

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

  let outputText = "";
  for (const [lineIndex, line] of lines.entries()) {
    const { lineCanvas, lineCtx } = prepareLine(canvas, line, vectorSize);
    cropToHorizontalBounds(lineCanvas, lineCtx);
    const segments = getCharacterSegments(lineCanvas, lineCtx);

    let segmentIndex = 0;
    let lineResults = "";

    let imagestoPredict = [];
    for (const segment of segments) {
      if (segment.type == "space") {
        const filledArray = new Array(vectorSize * vectorSize).fill(1);
        imagestoPredict.push(filledArray);
        continue;
      }

      segmentIndex++;
      const segmentImage = prepareSegment(
        lineCanvas,
        segment,
        `${lineIndex}_${segmentIndex}`
      );
      imagestoPredict.push(segmentImage);
    }
    lineResults += await predictCharacters(imagestoPredict);
    outputText += lineResults + "\n";
  }
  // if (spellCheck) {
  // 	console.log("\nSending text to spellcheck server: \n");
  // 	outputText = quickFilter(outputText);
  // 	outputText = await getCorrectedText(outputText);
  // }
  process.stdout.write(outputText);
  return outputText;
};

export default ocr;
