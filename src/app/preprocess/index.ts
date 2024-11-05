import { createCanvas, Image, Canvas, CanvasRenderingContext2D } from 'canvas';
import { binarize } from './otsu';
import { vectorSize } from '../config';
import * as fs from 'fs';

export const createAndLoadCanvas = (image: Image) => {
	const canvas = createCanvas(image.width, image.height);
	const ctx = canvas.getContext('2d');
	ctx.drawImage(image, 0, 0);
	return { canvas, ctx };
}

const isDarkBackground = (canvas: Canvas, ctx: CanvasRenderingContext2D) => {
	const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
	const data = imageData.data;
	let brightnessSum = 0;

	for (let i = 0; i < data.length; i += 4) {
		const brightness = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
		brightnessSum += brightness;
	}

	const avgBrightness = brightnessSum / (canvas.width * canvas.height);
	return avgBrightness < 128; // Adjust threshold as needed
};

export const invertIfDarkBackground = (canvas: Canvas, ctx: CanvasRenderingContext2D) => {
	if (isDarkBackground(canvas, ctx)) {
		console.log('Dark background. Inverting colors...');
		const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
		const data = imageData.data;

		for (let i = 0; i < data.length; i += 4) {
			data[i] = 255 - data[i];
			data[i + 1] = 255 - data[i + 1];
			data[i + 2] = 255 - data[i + 2];
		}

		ctx.putImageData(imageData, 0, 0);
	}
}


export const convertToGreyscale = (canvas: Canvas, ctx: CanvasRenderingContext2D) => {
	const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
	const data = imageData.data;

	for (let i = 0; i < data.length; i += 4) {
		const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
		data[i] = avg;
		data[i + 1] = avg;
		data[i + 2] = avg;
	}

	ctx.putImageData(imageData, 0, 0);
}

export const scaleImage = (canvas: Canvas, ctx: CanvasRenderingContext2D) => {
    const originalWidth = canvas.width;
    const originalHeight = canvas.height;
    const aspectRatio = originalWidth / originalHeight;

	let width = vectorSize;
    let height = vectorSize / aspectRatio;
    if (height > vectorSize) {
        height = vectorSize;
        width = vectorSize * aspectRatio;
    }

    const tempCanvas = createCanvas(width, height);
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(canvas, 0, 0, width, height);

    canvas.width = vectorSize;
    canvas.height = vectorSize;
	ctx.fillStyle = 'white';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	const x = (vectorSize - width) / 2;
	ctx.drawImage(tempCanvas, x, 0);
};
export const centerImageToVectorSize = (canvas: Canvas, ctx: CanvasRenderingContext2D) => {
	const originalWidth = canvas.width;
	let newWidth = vectorSize;
	let newHeight = vectorSize;

	const tempCanvas = createCanvas(newWidth, newHeight);
	const tempCtx = tempCanvas.getContext('2d');
	tempCtx.fillStyle = 'white';
	tempCtx.fillRect(0, 0, newWidth, newHeight);
	const x = (newWidth - originalWidth) / 2;
	const y = (newHeight - canvas.height) / 2;
	tempCtx.drawImage(canvas, x, y);
	canvas.width = newWidth;
	canvas.height = newHeight;
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.drawImage(tempCanvas, 0, 0);
}


export const cropToBoundingBox = (canvas: Canvas, ctx: CanvasRenderingContext2D, minY: number, maxY: number ) => {
	const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
	const data = imageData.data;
	let minX = canvas.width;
	let maxX = 0;

	for (let x = 0; x < canvas.width; x++) {
		for (let y = 0; y < canvas.height; y++) {
			const i = (y * canvas.width + x) * 4;
			if (data[i] === 0) {
				if (x < minX) minX = x;
				if (x > maxX) maxX = x;
			}
		}
	}

	const width = Math.abs(maxX - minX + 1)+2;
	const height = Math.abs(maxY - minY + 1)+2;

	const croppedCanvas = createCanvas(width, height);
	const croppedCtx = croppedCanvas.getContext('2d');
	croppedCtx.drawImage(canvas, minX, minY, width, height, 0, 0, width, height);

	canvas.width = width;
	canvas.height = height;
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.drawImage(croppedCanvas, 0, 0);
}

export const prepareLine = (canvas: Canvas, line: { start: number, end: number }, vectorSize: number) => {
	const lineHeight = line.end - line.start;
	const lineCanvas = new Canvas(canvas.width, lineHeight);
	const lineCtx = lineCanvas.getContext('2d');
	lineCtx.drawImage(canvas, 0, line.start, canvas.width, lineHeight, 0, 0, canvas.width, lineHeight);
	return { lineCanvas, lineCtx };
}

export const prepareSegment = (canvas: Canvas, segment: { start: number, end: number }, vectorSize: number ) => {
	const segmentWidth = segment.end - segment.start;
	const segmentCanvas = new Canvas(segmentWidth, canvas.height);
	const segmentCtx = segmentCanvas.getContext('2d');
	segmentCtx.drawImage(canvas, segment.start, 0, segmentWidth, canvas.height, 0, 0, segmentWidth, canvas.height);
	// TODO: bring back scaling after training model with scaled images
	// scaleImage(segmentCanvas, segmentCtx);
	centerImageToVectorSize(segmentCanvas, segmentCtx);
	const imageData = segmentCtx.getImageData(0, 0, segmentCanvas.width, segmentCanvas.height);
	const data = imageData.data;
    const grayscaleValues = [];
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        grayscaleValues.push(r);
    }
    const normalizedValues = grayscaleValues.map(value => value / 255);
    return normalizedValues;
}

export const pad = (canvas: Canvas, ctx: CanvasRenderingContext2D, padding: number) => {
	const width = canvas.width + padding * 2;
	const height = canvas.height + padding * 2;
	const paddedCanvas = createCanvas(width, height);
	const paddedCtx = paddedCanvas.getContext('2d');
	paddedCtx.fillStyle = 'white';
	paddedCtx.fillRect(0, 0, width, height);
	paddedCtx.drawImage(canvas, padding, padding);
	canvas.width = width;
	canvas.height = height;
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.drawImage(paddedCanvas, 0, 0);
}