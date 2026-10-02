// @testing-library/jest-dom adds custom matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom/vitest';

import { beforeEach, vi } from 'vitest';

// jsdom does not implement the ImageData constructor or canvas 2d context,
// so tests ship lightweight stand-ins with the same surface area.

class ImageDataShim {
  readonly data: Uint8ClampedArray;
  readonly width: number;
  readonly height: number;

  constructor(data: Uint8ClampedArray, width: number, height: number) {
    this.data = data;
    this.width = width;
    this.height = height;
  }
}

vi.stubGlobal('ImageData', ImageDataShim);

/**
 * Minimal 2D context stand-in shared by every canvas in the jsdom document.
 */
export const context2dMock = {
  canvas: null as HTMLCanvasElement | null,
  fillStyle: '',
  imageSmoothingEnabled: true,
  drawImage: vi.fn(),
  fillRect: vi.fn(),
  putImageData: vi.fn(),
  getImageData: vi.fn(
    (_x: number, _y: number, width: number, height: number) =>
      new ImageDataShim(
        new Uint8ClampedArray(width * height * 4),
        width,
        height,
      ),
  ),
};

vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
  () => context2dMock as unknown as CanvasRenderingContext2D,
);

/**
 * toBlob stand-in that reports the requested MIME type back to the callback.
 */
export const toBlobMock = vi.fn<
  (callback: BlobCallback, type?: string, quality?: number) => void
>((callback, type) => {
  callback(new Blob(['image'], { type: type ?? 'image/png' }));
});

HTMLCanvasElement.prototype.toBlob = toBlobMock;

/**
 * Anchor click stand-in; `mock.contexts` exposes the clicked anchor.
 */
export const anchorClickMock = vi.fn();

HTMLAnchorElement.prototype.click = anchorClickMock;

export const createObjectURLMock = vi.fn(() => 'blob:mock');
export const revokeObjectURLMock = vi.fn();

URL.createObjectURL = createObjectURLMock;
URL.revokeObjectURL = revokeObjectURLMock;

/**
 * Image stand-in that fires load/error on the microtask after `src` is set.
 * Setting a src containing "load-error" simulates a decode failure.
 */
export class TestImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  naturalWidth = 8;
  naturalHeight = 6;
  width = 8;
  height = 6;
  #src = '';

  get src(): string {
    return this.#src;
  }

  set src(value: string) {
    this.#src = value;
    queueMicrotask(() => {
      if (value.includes('load-error')) {
        this.onerror?.();
      } else {
        this.onload?.();
      }
    });
  }
}

vi.stubGlobal('Image', TestImage);

beforeEach(() => {
  vi.clearAllMocks();
});
