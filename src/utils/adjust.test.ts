import { adjustImage } from './adjust';

function createImage(pixels: number[], width = 1, height = 1): ImageData {
  return new ImageData(new Uint8ClampedArray(pixels), width, height);
}

describe('adjustImage', () => {
  it('returns identical pixels for neutral settings', () => {
    const input = createImage([10, 20, 30, 255, 40, 50, 60, 128], 1, 2);

    const output = adjustImage(input, {
      brightness: 100,
      contrast: 100,
      saturation: 100,
    });

    expect(Array.from(output.data)).toEqual([10, 20, 30, 255, 40, 50, 60, 128]);
    expect(output.width).toBe(1);
    expect(output.height).toBe(2);
  });

  it('sets pixels to black at 0% brightness', () => {
    const input = createImage([200, 150, 100, 42]);

    const output = adjustImage(input, {
      brightness: 0,
      contrast: 100,
      saturation: 100,
    });

    expect(Array.from(output.data)).toEqual([0, 0, 0, 42]);
  });

  it('clamps channels at 200% brightness', () => {
    const input = createImage([200, 0, 0, 255]);

    const output = adjustImage(input, {
      brightness: 200,
      contrast: 100,
      saturation: 100,
    });

    expect(Array.from(output.data)).toEqual([255, 0, 0, 255]);
  });

  it('flattens to mid gray at 0% contrast', () => {
    const input = createImage([10, 200, 50, 255]);

    const output = adjustImage(input, {
      brightness: 100,
      contrast: 0,
      saturation: 100,
    });

    expect(Array.from(output.data)).toEqual([128, 128, 128, 255]);
  });

  it('stretches channels around the midpoint at 200% contrast', () => {
    const white = adjustImage(createImage([255, 255, 255, 255]), {
      brightness: 100,
      contrast: 200,
      saturation: 100,
    });
    const black = adjustImage(createImage([0, 0, 0, 255]), {
      brightness: 100,
      contrast: 200,
      saturation: 100,
    });

    expect(Array.from(white.data)).toEqual([255, 255, 255, 255]);
    expect(Array.from(black.data)).toEqual([0, 0, 0, 255]);
  });

  it('converts to luma gray at 0% saturation', () => {
    const input = createImage([255, 0, 0, 255]);

    const output = adjustImage(input, {
      brightness: 100,
      contrast: 100,
      saturation: 0,
    });

    expect(Array.from(output.data)).toEqual([54, 54, 54, 255]);
  });

  it('amplifies color separation at 200% saturation', () => {
    const input = createImage([200, 100, 0, 255]);

    const output = adjustImage(input, {
      brightness: 100,
      contrast: 100,
      saturation: 200,
    });

    expect(Array.from(output.data)).toEqual([255, 86, 0, 255]);
  });
});
