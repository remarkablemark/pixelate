interface ColorEntry {
  key: number;
  red: number;
  green: number;
  blue: number;
  count: number;
}

const REDUCED_ENTRY_LIMIT = 8192;

function clampColors(maxColors: number): number {
  return Math.min(256, Math.max(1, Math.round(maxColors || 1)));
}

function buildHistogram(data: Uint8ClampedArray): Map<number, number> {
  const histogram = new Map<number, number>();
  for (let i = 0; i < data.length; i += 4) {
    const key = (data[i] << 16) | (data[i + 1] << 8) | data[i + 2];
    histogram.set(key, (histogram.get(key) ?? 0) + 1);
  }
  return histogram;
}

function toEntries(histogram: Map<number, number>): ColorEntry[] {
  const entries: ColorEntry[] = [];
  for (const [key, count] of histogram) {
    entries.push({
      key,
      red: (key >> 16) & 255,
      green: (key >> 8) & 255,
      blue: key & 255,
      count,
    });
  }
  return entries;
}

function expandChannel(value: number): number {
  return (value << 3) | (value >> 2);
}

function reduceEntries(entries: ColorEntry[]): ColorEntry[] {
  const reduced = new Map<number, ColorEntry>();
  for (const entry of entries) {
    const red = entry.red >> 3;
    const green = entry.green >> 3;
    const blue = entry.blue >> 3;
    const key = (red << 10) | (green << 5) | blue;
    const existing = reduced.get(key);
    if (existing) {
      existing.count += entry.count;
    } else {
      reduced.set(key, {
        key,
        red: expandChannel(red),
        green: expandChannel(green),
        blue: expandChannel(blue),
        count: entry.count,
      });
    }
  }
  return [...reduced.values()];
}

function channelRange(entries: ColorEntry[]): [number, number, number] {
  let minRed = 255;
  let minGreen = 255;
  let minBlue = 255;
  let maxRed = 0;
  let maxGreen = 0;
  let maxBlue = 0;
  for (const entry of entries) {
    minRed = Math.min(minRed, entry.red);
    minGreen = Math.min(minGreen, entry.green);
    minBlue = Math.min(minBlue, entry.blue);
    maxRed = Math.max(maxRed, entry.red);
    maxGreen = Math.max(maxGreen, entry.green);
    maxBlue = Math.max(maxBlue, entry.blue);
  }
  return [maxRed - minRed, maxGreen - minGreen, maxBlue - minBlue];
}

type Channel = 'red' | 'green' | 'blue';

function widestChannel(entries: ColorEntry[]): Channel {
  const [red, green, blue] = channelRange(entries);
  if (red >= green && red >= blue) return 'red';
  if (green >= blue) return 'green';
  return 'blue';
}

function boxPriority(entries: ColorEntry[]): number {
  const [red, green, blue] = channelRange(entries);
  return red + green + blue;
}

function splitBox(boxes: ColorEntry[][]): void {
  let bestIndex = -1;
  let bestPriority = 0;
  for (let index = 0; index < boxes.length; index++) {
    const box = boxes[index];
    if (box.length < 2) continue;
    const priority = boxPriority(box);
    if (priority > bestPriority) {
      bestPriority = priority;
      bestIndex = index;
    }
  }
  if (bestIndex === -1) return;

  const box = boxes[bestIndex];
  const channel = widestChannel(box);
  box.sort((a, b) => a[channel] - b[channel]);
  const middle = Math.floor(box.length / 2);
  boxes.splice(bestIndex, 1, box.slice(0, middle), box.slice(middle));
}

function medianCut(entries: ColorEntry[], maxColors: number): ColorEntry[][] {
  const boxes: ColorEntry[][] = [entries];
  while (boxes.length < maxColors) {
    const before = boxes.length;
    splitBox(boxes);
    if (boxes.length === before) break;
  }
  return boxes;
}

function buildPalette(boxes: ColorEntry[][]): Record<number, ColorEntry> {
  const palette: Record<number, ColorEntry> = {};
  for (const box of boxes) {
    let count = 0;
    let red = 0;
    let green = 0;
    let blue = 0;
    for (const entry of box) {
      count += entry.count;
      red += entry.red * entry.count;
      green += entry.green * entry.count;
      blue += entry.blue * entry.count;
    }
    const average: ColorEntry = {
      key: box[0].key,
      red: Math.round(red / count),
      green: Math.round(green / count),
      blue: Math.round(blue / count),
      count,
    };
    for (const entry of box) {
      palette[entry.key] = average;
    }
  }
  return palette;
}

/**
 * Reduces the number of distinct colors in image data to at most `maxColors`
 * using a median-cut palette. Alpha is preserved per pixel.
 */
export function quantizeImage(
  imageData: ImageData,
  maxColors: number,
): ImageData {
  const colors = clampColors(maxColors);
  const { width, height, data } = imageData;
  const histogram = buildHistogram(data);

  if (histogram.size <= colors) {
    return new ImageData(new Uint8ClampedArray(data), width, height);
  }

  const rawEntries = toEntries(histogram);
  const reduced = histogram.size > REDUCED_ENTRY_LIMIT;
  const entries = reduced ? reduceEntries(rawEntries) : rawEntries;
  const palette = buildPalette(medianCut(entries, colors));

  const target = new Uint8ClampedArray(data.length);
  for (let i = 0; i < data.length; i += 4) {
    const key = reduced
      ? ((data[i] >> 3) << 10) | ((data[i + 1] >> 3) << 5) | (data[i + 2] >> 3)
      : (data[i] << 16) | (data[i + 1] << 8) | data[i + 2];
    const entry = palette[key];
    target[i] = entry.red;
    target[i + 1] = entry.green;
    target[i + 2] = entry.blue;
    target[i + 3] = data[i + 3];
  }

  return new ImageData(target, width, height);
}
