import type { PixelateSettings } from 'src/types/settings';

function clampBlockSize(blockSize: number): number {
  if (Number.isNaN(blockSize)) return 1;
  return Math.max(Math.floor(blockSize), 1);
}

function writeBlock(
  target: Uint8ClampedArray,
  width: number,
  startX: number,
  endX: number,
  startY: number,
  endY: number,
  red: number,
  green: number,
  blue: number,
  alpha: number,
): void {
  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      const index = (y * width + x) * 4;
      target[index] = red;
      target[index + 1] = green;
      target[index + 2] = blue;
      target[index + 3] = alpha;
    }
  }
}

/**
 * Pixelates image data by replacing every blockSize × blockSize region with
 * either the region's average color or its center pixel color.
 */
export function pixelateImage(
  imageData: ImageData,
  settings: PixelateSettings,
): ImageData {
  const { width, height, data } = imageData;
  const blockSize = clampBlockSize(settings.blockSize);
  const target = new Uint8ClampedArray(data.length);
  const centerOffset = Math.floor(blockSize / 2);

  for (let blockY = 0; blockY < height; blockY += blockSize) {
    const endY = Math.min(blockY + blockSize, height);

    for (let blockX = 0; blockX < width; blockX += blockSize) {
      const endX = Math.min(blockX + blockSize, width);

      if (settings.mode === 'nearest') {
        const x = Math.min(blockX + centerOffset, width - 1);
        const y = Math.min(blockY + centerOffset, height - 1);
        const index = (y * width + x) * 4;
        writeBlock(
          target,
          width,
          blockX,
          endX,
          blockY,
          endY,
          data[index],
          data[index + 1],
          data[index + 2],
          data[index + 3],
        );
        continue;
      }

      let sumRed = 0;
      let sumGreen = 0;
      let sumBlue = 0;
      let sumAlpha = 0;
      let count = 0;

      for (let y = blockY; y < endY; y++) {
        for (let x = blockX; x < endX; x++) {
          const index = (y * width + x) * 4;
          const alpha = data[index + 3];
          sumRed += data[index] * alpha;
          sumGreen += data[index + 1] * alpha;
          sumBlue += data[index + 2] * alpha;
          sumAlpha += alpha;
          count += 1;
        }
      }

      const alpha = Math.round(sumAlpha / count);
      const red = sumAlpha === 0 ? 0 : Math.round(sumRed / sumAlpha);
      const green = sumAlpha === 0 ? 0 : Math.round(sumGreen / sumAlpha);
      const blue = sumAlpha === 0 ? 0 : Math.round(sumBlue / sumAlpha);

      writeBlock(
        target,
        width,
        blockX,
        endX,
        blockY,
        endY,
        red,
        green,
        blue,
        alpha,
      );
    }
  }

  return new ImageData(target, width, height);
}
