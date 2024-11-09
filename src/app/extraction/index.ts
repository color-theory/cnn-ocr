import { Canvas, CanvasRenderingContext2D } from "canvas";
import { determineOptimalThreshold } from "../preprocess/otsu";

export const getLineSegments = (
  canvas: Canvas,
  ctx: CanvasRenderingContext2D
) => {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const rowHistogram = new Array(canvas.height).fill(0);

  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const i = (y * canvas.width + x) * 4;
      rowHistogram[y] += data[i];
    }
  }

  const max = Math.max(...rowHistogram);
  const normalized = rowHistogram.map((value) => value / max);
  const threshold = 1 - determineOptimalThreshold(canvas, ctx) / max;

  const lines = [];
  let lineStart = 0;
  let inLine = false;
  let lineEnd = 0;
  for (let i = 0; i < normalized.length; i++) {
    if (normalized[i] <= threshold) {
      if (!inLine) {
        lineStart = i;
        inLine = true;
      }
    } else {
      if (inLine) {
        lineEnd = i;
        lines.push({ start: lineStart, end: lineEnd });
        inLine = false;
      }
    }
  }
  return lines;
};

const calculateNormalizedColumnHistogramAndThreshold = (
  canvas: Canvas,
  ctx: CanvasRenderingContext2D
): [number[], number] => {
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

const estimateMaxGapWidth = (columnHistogram: number[], threshold: number) => {
  const gapWidths = [];
  let currentGapWidth = 0;
  let inGap = false;
  for (const value of columnHistogram) {
    if (value > threshold) {
      if (inGap) {
        currentGapWidth++;
      } else {
        inGap = true;
        currentGapWidth = 1;
      }
    } else if (inGap) {
      if (currentGapWidth > 1) {
        gapWidths.push(currentGapWidth);
      }
      inGap = false;
      currentGapWidth = 0;
    }
  }
  if (inGap && currentGapWidth > 1) {
    gapWidths.push(currentGapWidth);
  }

  gapWidths.sort((a, b) => a - b);
  const percentileIndex = Math.floor(gapWidths.length * 0.55);
  const dynamicMaxGapWidth = gapWidths[percentileIndex] || 1;

  return dynamicMaxGapWidth;
};

const segmentCharacters = (
  columnHistogram: number[],
  threshold: number,
  maxGapWidth: number
) => {
  const segments: {
    start: number;
    end: number;
    type: "space" | "character";
  }[] = [];
  let segmentStart = 0;
  let segmentType: "space" | "character" =
    columnHistogram[0] > threshold ? "space" : "character";
  let gapWidth = 0;

  for (let i = 1; i < columnHistogram.length; i++) {
    const currentType = columnHistogram[i] > threshold ? "space" : "character";

    if (currentType !== segmentType) {
      if (currentType === "space") {
        gapWidth = 1;
        segments.push({ start: segmentStart, end: i, type: segmentType });
      } else {
        if (gapWidth <= maxGapWidth) {
          gapWidth = 0;
        } else {
          segments.push({ start: segmentStart, end: i, type: segmentType });
        }
      }
      segmentStart = i;
      segmentType = currentType;
    } else if (segmentType === "space") {
      gapWidth++;
    }
  }
  segments.push({
    start: segmentStart,
    end: columnHistogram.length - 1,
    type: segmentType,
  });

  return segments;
};

export const getCharacterSegments = (
  canvas: Canvas,
  ctx: CanvasRenderingContext2D
) => {
  const [columnHistogram, threshold] =
    calculateNormalizedColumnHistogramAndThreshold(canvas, ctx);
  const maxGapWidth = estimateMaxGapWidth(columnHistogram, threshold);
  const segments = segmentCharacters(columnHistogram, threshold, maxGapWidth);
  return segments;
};

export const extractCharacterFeatures = (
  canvas: Canvas,
  ctx: CanvasRenderingContext2D
) => {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const features = [];

  for (let i = 0; i < data.length; i += 4) {
    features.push(data[i] === 0 ? 1 : 0);
  }

  const notEmpty =
    features.some((pixel) => pixel === 1) &&
    features.some((pixel) => pixel === 0);

  if (!notEmpty) {
    return new Array(data.length).fill(0);
  }

  return features;
};

const getHistogramMin = (histogram: number[]) => {
  let value = null;
  for (let i = 0; i < histogram.length; i++) {
    if (histogram[i] < 1 && value === null) {
      value = i;
      break;
    }
  }
  return value ?? 0;
};

const getHistogramMax = (histogram: number[]) => {
  let value = null;
  for (let i = histogram.length - 1; i >= 0; i--) {
    if (histogram[i] < 1 && value === null) {
      value = i;
      break;
    }
  }
  return value ?? histogram.length - 1;
};

export const getBounds = (canvas: Canvas, ctx: CanvasRenderingContext2D) => {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const rowHistogram = new Array(canvas.height).fill(0);
  const columnHistogram = new Array(canvas.width).fill(0);

  for (let x = 0; x < canvas.width; x++) {
    for (let y = 0; y < canvas.height; y++) {
      const i = (y * canvas.width + x) * 4;
      rowHistogram[y] += data[i];
      columnHistogram[x] += data[i];
    }
  }
  const maxValue = Math.max(...rowHistogram);
  const normalizedRows = rowHistogram.map((value) => value / maxValue);
  const normalizedColumns = columnHistogram.map((value) => value / maxValue);

  return {
    minX: getHistogramMin(normalizedColumns),
    maxX: getHistogramMax(normalizedColumns),
    minY: getHistogramMin(normalizedRows),
    maxY: getHistogramMax(normalizedRows),
  };
};
