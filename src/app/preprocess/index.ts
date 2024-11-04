import { createCanvas, Image, Canvas, CanvasRenderingContext2D } from 'canvas';

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

export const scaleImage = (canvas: Canvas, ctx: CanvasRenderingContext2D, maxWidth: number, maxHeight: number) => {
	const originalWidth = canvas.width;
	const originalHeight = canvas.height;
	const aspectRatio = originalWidth / originalHeight;

	let width = maxWidth;
	let height = maxWidth / aspectRatio;
	if (height > maxHeight) {
		height = maxHeight;
		width = maxHeight * aspectRatio;
	}

	const tempCanvas = createCanvas(width, height);
	const tempCtx = tempCanvas.getContext('2d');
	tempCtx.drawImage(canvas, 0, 0, width, height);

	canvas.width = maxWidth;
	canvas.height = maxHeight;
	ctx.fillStyle = 'white';
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	ctx.drawImage(tempCanvas, 0, 0);
};

export const cropToBoundingBox = (canvas: Canvas, ctx: CanvasRenderingContext2D, minY: number, maxY: number) => {
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

	const width = Math.abs(maxX - minX + 1) + 2;
	const height = Math.abs(maxY - minY + 1) + 2;

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
	pad(lineCanvas, lineCtx, 2);
	cropToBoundingBox(lineCanvas, lineCtx, 0, vectorSize);
	return { lineCanvas, lineCtx };

}

export const prepareSegment = (canvas: Canvas, segment: { start: number, end: number }, vectorSize: number) => {
	const segmentWidth = segment.end - segment.start;
	const segmentCanvas = new Canvas(segmentWidth, canvas.height);
	const segmentCtx = segmentCanvas.getContext('2d');
	segmentCtx.drawImage(canvas, segment.start, 0, segmentWidth, canvas.height, 0, 0, segmentWidth, canvas.height);
	// cropToBoundingBox(segmentCanvas, segmentCtx, 0, canvas.height);
	scaleImage(segmentCanvas, segmentCtx, vectorSize, vectorSize);

	return { segmentCanvas, segmentCtx };
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