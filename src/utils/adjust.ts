import type { AdjustSettings } from 'src/types/settings';

const LUMA_RED = 0.2126;
const LUMA_GREEN = 0.7152;
const LUMA_BLUE = 0.0722;

function clampChannel(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

/**
 * Applies brightness, contrast, and saturation adjustments to every pixel.
 * Values are percentages where 100 is neutral. Alpha is left untouched.
 */
export function adjustImage(
  imageData: ImageData,
  settings: AdjustSettings,
): ImageData {
  const { brightness, contrast, saturation } = settings;
  const brightnessFactor = brightness / 100;
  const contrastFactor = contrast / 100;
  const saturationFactor = saturation / 100;
  const source = imageData.data;
  const data = new Uint8ClampedArray(source.length);

  for (let i = 0; i < source.length; i += 4) {
    let red = source[i] * brightnessFactor;
    let green = source[i + 1] * brightnessFactor;
    let blue = source[i + 2] * brightnessFactor;

    red = (red - 128) * contrastFactor + 128;
    green = (green - 128) * contrastFactor + 128;
    blue = (blue - 128) * contrastFactor + 128;

    const luma = LUMA_RED * red + LUMA_GREEN * green + LUMA_BLUE * blue;
    red = luma + (red - luma) * saturationFactor;
    green = luma + (green - luma) * saturationFactor;
    blue = luma + (blue - luma) * saturationFactor;

    data[i] = clampChannel(red);
    data[i + 1] = clampChannel(green);
    data[i + 2] = clampChannel(blue);
    data[i + 3] = source[i + 3];
  }

  return new ImageData(data, imageData.width, imageData.height);
}
