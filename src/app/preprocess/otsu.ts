/**
 * Otsu's method to separate the foreground and background of an image
 */

import { Canvas, CanvasRenderingContext2D } from 'canvas';


const createHistogram = (valueData: Uint8ClampedArray) => {
	const histogram = Array(256).fill(0);

	for (let i = 0; i < valueData.length; i += 4) {
		const value = valueData[i];
		histogram[value]++;
	}

	return histogram;
}

export const determineOptimalThreshold = (canvas: Canvas, ctx: CanvasRenderingContext2D) => {
	const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
	const data = imageData.data;
	const histogram = createHistogram(data);

	const totalPixels = canvas.width * canvas.height;

	let sum = 0;
	for (let i = 0; i < 256; i++) {
		sum += i * histogram[i];
	}

	let sumB = 0;
	let wB = 0;
	let wF = 0;
	let mB;
	let mF;
	let max = 0.0; // We'll be using the maximum between-class variance as the threshold
	let threshold = 0;

	for (let i = 0; i < 256; i++) {
		wB += histogram[i];	// add to the proportion of background pixels that are below the threshold
		if (wB === 0) continue;

		wF = totalPixels - wB;
		if (wF === 0) break; // this threshold only has background pixels so we can stop

		sumB += i * histogram[i];
		mB = sumB / wB;
		mF = (sum - sumB) / wF;

		const between = wB * wF * (mB - mF) * (mB - mF); // between-class variance, the higher the better

		if (between >= max) {
			threshold = i;
			max = between;
		}
	}

	return threshold;
}

export const binarize = (canvas: Canvas, ctx: CanvasRenderingContext2D) => {
	const threshold = determineOptimalThreshold(canvas, ctx);
	const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
	const data = imageData.data;

	for (let i = 0; i < data.length; i += 4) {
		const preValue = data[i];
		const postValue = preValue > threshold ? 255 : 0;

		data[i] = postValue;
		data[i + 1] = postValue;
		data[i + 2] = postValue;
	}

	ctx.putImageData(imageData, 0, 0);
}