import type { FormatSetting, OutputFormat } from 'src/types/settings';

const MIME_TYPES: Record<OutputFormat, string> = {
  png: 'image/png',
  webp: 'image/webp',
  jpeg: 'image/jpeg',
};

const DEFAULT_QUALITY = 0.92;

/**
 * Detects the output format to default to for a source file. Unsupported
 * types fall back to PNG.
 */
export function getSourceFormat(file: File): OutputFormat {
  const type = file.type.toLowerCase();
  if (type === 'image/jpeg' || type === 'image/jpg') return 'jpeg';
  if (type === 'image/webp') return 'webp';
  if (type === 'image/png') return 'png';
  return 'png';
}

/**
 * Resolves the format setting against the source format.
 */
export function resolveFormat(
  setting: FormatSetting,
  sourceFormat: OutputFormat,
): OutputFormat {
  return setting === 'auto' ? sourceFormat : setting;
}

/**
 * Decodes a file into an image element using an object URL.
 */
export function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not decode image'));
    };

    image.src = url;
  });
}

function requireContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas is not supported');
  return context;
}

/**
 * Draws an image onto a canvas and reads back its pixels.
 */
export function imageToImageData(image: HTMLImageElement): ImageData {
  const { naturalWidth: width, naturalHeight: height } = image;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = requireContext(canvas);
  context.drawImage(image, 0, 0);
  return context.getImageData(0, 0, width, height);
}

/**
 * Renders image data onto a new canvas element.
 */
export function imageDataToCanvas(imageData: ImageData): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const context = requireContext(canvas);
  context.putImageData(imageData, 0, 0);
  return canvas;
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to encode image'));
        }
      },
      mimeType,
      quality,
    );
  });
}

/**
 * Exports a canvas as a blob in the requested format. JPEG exports are
 * flattened onto a white background first so transparency is preserved
 * everywhere else.
 */
export async function exportCanvas(
  canvas: HTMLCanvasElement,
  format: OutputFormat,
  quality: number = DEFAULT_QUALITY,
): Promise<Blob> {
  if (format !== 'jpeg') {
    return canvasToBlob(canvas, MIME_TYPES[format], quality);
  }

  const flattened = document.createElement('canvas');
  flattened.width = canvas.width;
  flattened.height = canvas.height;
  const context = requireContext(flattened);
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, flattened.width, flattened.height);
  context.drawImage(canvas, 0, 0);
  return canvasToBlob(flattened, MIME_TYPES.jpeg, quality);
}

function getExtension(mimeType: string): string {
  if (mimeType === 'image/webp') return 'webp';
  if (mimeType === 'image/jpeg') return 'jpg';
  return 'png';
}

/**
 * Triggers a browser download for a blob, naming the file from the blob's
 * actual type (which may differ from the requested format).
 */
export function downloadBlob(blob: Blob, baseName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${baseName}.${getExtension(blob.type)}`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
