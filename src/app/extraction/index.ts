import { Canvas, CanvasRenderingContext2D } from 'canvas';
import { determineOptimalThreshold } from '../preprocess/otsu';

export const getLineSegments = (canvas: Canvas, ctx: CanvasRenderingContext2D) => {
	const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
	const data = imageData.data;
	const rowHistogram = new Array(canvas.height).fill(0);

	for (let y = 0; y < canvas.height; y++) {
		for (let x = 0; x < canvas.width; x++) {
			const i = (y * canvas.width + x) * 4;
			rowHistogram[y] += data[i];;
		}
	}

	const max = Math.max(...rowHistogram);
	const normalized = rowHistogram.map((value) => value / max);
	const threshold = 1 - determineOptimalThreshold(canvas, ctx) / max;

	const lines = [];
	let lineStart= 0;
	let inLine = false;
	let lineEnd = 0;
	for (let i = 0; i < normalized.length; i++) {
		if (normalized[i] <= threshold) {
			if (!inLine) {
				lineStart = i;
				inLine = true;
			}
		}else{
			if (inLine) {
				lineEnd = i;
				lines.push({ start: lineStart, end: lineEnd });
				inLine = false;
			}
		}
	}
	return lines;
}

const calculateNormalizedColumnHistogramAndThreshold = (canvas: Canvas, ctx: CanvasRenderingContext2D): [number[], number] => {
	const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
	const data = imageData.data;
	const columnHistogram = new Array(canvas.width).fill(0);

	for (let x = 0; x < canvas.width; x++) {
		for (let y = 0; y < canvas.height; y++) {
			const i = (y * canvas.width + x) * 4;
			columnHistogram[x] += data[i];
		}
	}
	const max = Math.max(...columnHistogram);
	const normalized = columnHistogram.map((value) => value / max);
	const threshold = 1 - determineOptimalThreshold(canvas, ctx) / max;
	return [normalized, threshold];
};

const segmentCharacters = (columnHistogram: number[], lineHeight: number, threshold: number) => {
	const segments: { start: number, end: number, type: string }[] = [];
	let segmentStart = 0;
	let inSegment = false;
	let outOfSegmentCount = 0;
	let averageCharacterWidth = lineHeight / 2;
	let gapSizes = [];

	let segmentLength = 0;
	for (let x = 0; x < columnHistogram.length; x++) {
		if (columnHistogram[x] <= threshold && !inSegment) {
			segments.push({ start: segmentStart, end: x, type: 'gap' });
			gapSizes.push(x - segmentStart);
			segmentStart = x;
			inSegment = true;
			outOfSegmentCount = 0;
		} else if ((columnHistogram[x] > threshold && inSegment)) {
			const segmentEnd = x;
			inSegment = false;
			segments.push({ start: segmentStart, end: segmentEnd, type: 'character' });
			averageCharacterWidth = (averageCharacterWidth + (segmentEnd - segmentStart)) / 2;
			segmentStart = x;
		} else if (columnHistogram[x] > threshold) {
			outOfSegmentCount++;
		}
		segmentLength++;
	}
	if (inSegment) {
		segments.push({ start: segmentStart, end: columnHistogram.length, type: 'character' });
	}

	const wordThreshold = gapSizes.reduce((acc, gap) => acc + gap, 0) / gapSizes.length;
	segments.forEach((segment, index) => {
		if (segment.type === 'gap') {
			if (segment.end - segment.start > wordThreshold * 1.5) {
				segments[index].type = 'space';
			}
		}
	});
	return segments;
};

export const getCharacterSegments = (canvas: Canvas, ctx: CanvasRenderingContext2D) => {
	const [columnHistogram, threshold] = calculateNormalizedColumnHistogramAndThreshold(canvas, ctx);
	const segments = segmentCharacters(columnHistogram, canvas.height, threshold);
	return segments;
};

export const extractCharacterFeatures = (canvas: Canvas, ctx: CanvasRenderingContext2D) => {
	const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
	const data = imageData.data;
	const features = [];

	for (let i = 0; i < data.length; i += 4) {
		features.push(data[i] === 0 ? 1 : 0);
	}

	const notEmpty = features.some((pixel) => pixel === 1) && features.some((pixel) => pixel === 0);

	if (!notEmpty) {
		return new Array(data.length).fill(0);
	}

	return features;
}

export const getBounds = (canvas: Canvas, ctx: CanvasRenderingContext2D) => {
	const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
	const data = imageData.data;
	let minY = null;
	let maxY = null;
	let minX = null;
	let maxX = null;

	for (let y = 0; y < canvas.height; y++) {
		for (let x = 0; x < canvas.width; x++) {
			const i = (y * canvas.width + x) * 4;

			// Detect first non-white row (upper bound)
			if (data[i] < 255 || data[i + 1] < 255 || data[i + 2] < 255) {
				if (minY === null) minY = y;
				maxY = y; // Keep updating maxY for every non-background pixel row
				minX = minX !== null ? Math.min(minX, x) : x;
				maxX = maxX !== null ? Math.max(maxX, x) : x;
				break;
			}
		}
	}

	// Set defaults if no foreground was found
	minY = minY !== null ? minY : 0;
	maxY = maxY !== null ? maxY : canvas.height;
	minX = minX !== null ? minX : 0;
	maxX = maxX !== null ? maxX : canvas.width;

	return { minX, minY, maxX, maxY };
};