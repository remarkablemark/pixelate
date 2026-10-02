import { quantizeImage } from './quantize';

function createImage(
  width: number,
  height: number,
  pixels: number[],
): ImageData {
  return new ImageData(new Uint8ClampedArray(pixels), width, height);
}

function createColorImage(colors: number[][]): ImageData {
  const pixels: number[] = [];
  for (const [red, green, blue] of colors) {
    pixels.push(red, green, blue, 255);
  }
  return new ImageData(new Uint8ClampedArray(pixels), colors.length, 1);
}

function distinctColors(imageData: ImageData): number {
  const colors = new Set<number>();
  for (let i = 0; i < imageData.data.length; i += 4) {
    colors.add(
      (imageData.data[i] << 16) |
        (imageData.data[i + 1] << 8) |
        imageData.data[i + 2],
    );
  }
  return colors.size;
}

describe('quantizeImage', () => {
  it('returns image data unchanged when colors fit the budget', () => {
    const input = createImage(2, 1, [255, 0, 0, 255, 0, 0, 255, 255]);

    const output = quantizeImage(input, 4);

    expect(Array.from(output.data)).toEqual([255, 0, 0, 255, 0, 0, 255, 255]);
    expect(output).not.toBe(input);
  });

  it('merges everything into one color at maxColors of 1', () => {
    const input = createImage(2, 1, [255, 0, 0, 255, 0, 0, 255, 255]);

    const output = quantizeImage(input, 1);

    expect(Array.from(output.data)).toEqual([
      128, 0, 128, 255, 128, 0, 128, 255,
    ]);
  });

  it('reduces to at most maxColors and preserves alpha', () => {
    const pixels: number[] = [];
    for (let i = 0; i < 16; i++) {
      pixels.push(i * 17, i * 17, i * 17, 200);
    }
    const input = createImage(4, 4, pixels);

    const output = quantizeImage(input, 4);

    expect(distinctColors(output)).toBeLessThanOrEqual(4);
    for (let i = 3; i < output.data.length; i += 4) {
      expect(output.data[i]).toBe(200);
    }
  });

  it('handles images with more than 8192 unique colors', () => {
    const pixels: number[] = [];
    for (let i = 0; i < 9216; i++) {
      pixels.push(i & 255, (i >> 8) & 255, 0, 255);
    }
    const input = createImage(96, 96, pixels);

    const output = quantizeImage(input, 8);

    expect(distinctColors(output)).toBeLessThanOrEqual(8);
  });

  it('splits boxes on their widest channel', () => {
    const green = quantizeImage(
      createColorImage([
        [0, 0, 0],
        [10, 0, 0],
        [10, 255, 0],
      ]),
      2,
    );
    const blue = quantizeImage(
      createColorImage([
        [0, 0, 0],
        [0, 10, 0],
        [0, 10, 255],
      ]),
      2,
    );
    const mixed = quantizeImage(
      createColorImage([
        [0, 0, 0],
        [100, 50, 200],
        [50, 25, 100],
      ]),
      2,
    );

    expect(Array.from(green.data)).toEqual([
      0, 0, 0, 255, 10, 128, 0, 255, 10, 128, 0, 255,
    ]);
    expect(Array.from(blue.data)).toEqual([
      0, 0, 0, 255, 0, 10, 128, 255, 0, 10, 128, 255,
    ]);
    expect(Array.from(mixed.data)).toEqual([
      0, 0, 0, 255, 75, 38, 150, 255, 75, 38, 150, 255,
    ]);
  });

  it('keeps splitting until the budget is exhausted', () => {
    const input = createColorImage([
      [0, 0, 0],
      [51, 51, 51],
      [102, 102, 102],
      [153, 153, 153],
      [204, 204, 204],
    ]);

    const output = quantizeImage(input, 4);

    const reds = new Set<number>();
    for (let i = 0; i < output.data.length; i += 4) {
      reds.add(output.data[i]);
    }
    expect([...reds].sort((a, b) => a - b)).toEqual([0, 51, 102, 179]);
  });

  it('stops splitting when reduction leaves fewer colors than the budget', () => {
    const pixels: number[] = [];
    for (let i = 0; i < 9216; i++) {
      pixels.push(i & 255, (i >> 8) & 255, 0, 255);
    }
    const input = createImage(96, 96, pixels);

    const output = quantizeImage(input, 200);

    const distinct = distinctColors(output);
    expect(distinct).toBeLessThanOrEqual(200);
    expect(distinct).toBeGreaterThan(100);
  });

  it('clamps a maxColors of 0 down to one color', () => {
    const input = createImage(2, 1, [255, 0, 0, 255, 0, 0, 255, 255]);

    const output = quantizeImage(input, 0);

    expect(distinctColors(output)).toBe(1);
  });

  it('clamps a NaN maxColors down to one color', () => {
    const input = createImage(2, 1, [255, 0, 0, 255, 0, 0, 255, 255]);

    const output = quantizeImage(input, Number.NaN);

    expect(distinctColors(output)).toBe(1);
  });

  it('clamps an oversized maxColors to 256', () => {
    const pixels: number[] = [];
    for (let i = 0; i < 16; i++) {
      pixels.push(i * 17, 0, 0, 255);
    }
    const input = createImage(4, 4, pixels);

    const output = quantizeImage(input, 1000);

    expect(distinctColors(output)).toBeLessThanOrEqual(256);
    expect(distinctColors(output)).toBe(16);
  });
});
