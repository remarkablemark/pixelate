import { pixelateImage } from './pixelate';

function createImage(
  width: number,
  height: number,
  pixels: number[],
): ImageData {
  return new ImageData(new Uint8ClampedArray(pixels), width, height);
}

function pixelAt(imageData: ImageData, x: number, y: number): number[] {
  const index = (y * imageData.width + x) * 4;
  return Array.from(imageData.data.slice(index, index + 4));
}

describe('pixelateImage', () => {
  it('replaces each block with the average of its pixels', () => {
    // 4x4 image: top-left block mixes black and white.
    const input = createImage(
      4,
      4,
      [
        // row 0: block(0,0) black, black | block(2,0) white, white
        0, 0, 0, 255, 0, 0, 0, 255, 255, 255, 255, 255, 255, 255, 255, 255,
        // row 1
        255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
        255, 255,
        // row 2
        100, 150, 200, 255, 100, 150, 200, 255, 50, 50, 50, 255, 50, 50, 50,
        255,
        // row 3
        100, 150, 200, 255, 100, 150, 200, 255, 50, 50, 50, 255, 50, 50, 50,
        255,
      ],
    );

    const output = pixelateImage(input, { blockSize: 2, mode: 'average' });

    expect(pixelAt(output, 0, 0)).toEqual([128, 128, 128, 255]);
    expect(pixelAt(output, 1, 1)).toEqual([128, 128, 128, 255]);
    expect(pixelAt(output, 3, 0)).toEqual([255, 255, 255, 255]);
    expect(pixelAt(output, 0, 3)).toEqual([100, 150, 200, 255]);
    expect(pixelAt(output, 3, 3)).toEqual([50, 50, 50, 255]);
  });

  it('samples the center pixel in nearest mode', () => {
    const input = createImage(
      4,
      4,
      [
        1, 1, 1, 255, 1, 1, 1, 255, 1, 1, 1, 255, 1, 1, 1, 255, 1, 1, 1, 255,
        10, 20, 30, 255, 1, 1, 1, 255, 1, 1, 1, 255, 1, 1, 1, 255, 1, 1, 1, 255,
        1, 1, 1, 255, 1, 1, 1, 255, 1, 1, 1, 255, 1, 1, 1, 255, 1, 1, 1, 255, 1,
        1, 1, 255,
      ],
    );

    const output = pixelateImage(input, { blockSize: 2, mode: 'nearest' });

    expect(pixelAt(output, 0, 0)).toEqual([10, 20, 30, 255]);
    expect(pixelAt(output, 1, 1)).toEqual([10, 20, 30, 255]);
    expect(pixelAt(output, 2, 0)).toEqual([1, 1, 1, 255]);
  });

  it('keeps identity in nearest mode with a block size of 1', () => {
    const input = createImage(2, 1, [5, 6, 7, 255, 8, 9, 10, 255]);

    const output = pixelateImage(input, { blockSize: 1, mode: 'nearest' });

    expect(Array.from(output.data)).toEqual([5, 6, 7, 255, 8, 9, 10, 255]);
  });

  it('averages colors premultiplied by alpha', () => {
    const input = createImage(2, 1, [255, 0, 0, 0, 0, 255, 0, 255]);

    const output = pixelateImage(input, { blockSize: 2, mode: 'average' });

    expect(pixelAt(output, 0, 0)).toEqual([0, 255, 0, 128]);
    expect(pixelAt(output, 1, 0)).toEqual([0, 255, 0, 128]);
  });

  it('produces transparent black for fully transparent blocks', () => {
    const input = createImage(2, 1, [10, 20, 30, 0, 40, 50, 60, 0]);

    const output = pixelateImage(input, { blockSize: 2, mode: 'average' });

    expect(pixelAt(output, 0, 0)).toEqual([0, 0, 0, 0]);
    expect(pixelAt(output, 1, 0)).toEqual([0, 0, 0, 0]);
  });

  it('clamps a block size larger than the image', () => {
    const input = createImage(
      2,
      2,
      [90, 90, 90, 255, 90, 90, 90, 255, 90, 90, 90, 255, 90, 90, 90, 255],
    );

    const output = pixelateImage(input, { blockSize: 64, mode: 'average' });

    expect(pixelAt(output, 1, 1)).toEqual([90, 90, 90, 255]);
  });

  it('treats invalid block sizes as 1', () => {
    const pixels = [5, 6, 7, 255, 8, 9, 10, 255];
    const input = createImage(2, 1, pixels);
    const expected = [...pixels];

    const zero = pixelateImage(input, { blockSize: 0, mode: 'average' });
    const notANumber = pixelateImage(input, {
      blockSize: Number.NaN,
      mode: 'average',
    });
    const negative = pixelateImage(input, { blockSize: -3, mode: 'average' });

    expect(Array.from(zero.data)).toEqual(expected);
    expect(Array.from(notANumber.data)).toEqual(expected);
    expect(Array.from(negative.data)).toEqual(expected);
  });

  it('floors fractional block sizes', () => {
    const input = createImage(2, 1, [5, 6, 7, 255, 8, 9, 10, 255]);

    const output = pixelateImage(input, {
      blockSize: 1.9,
      mode: 'average',
    });

    expect(Array.from(output.data)).toEqual([5, 6, 7, 255, 8, 9, 10, 255]);
  });

  it('averages partial blocks along the right and bottom edges', () => {
    const pixels: number[] = [];
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        const value = y * 5 + x + 1;
        pixels.push(value, value, value, 255);
      }
    }
    const input = createImage(5, 5, pixels);

    const output = pixelateImage(input, { blockSize: 4, mode: 'average' });

    expect(pixelAt(output, 3, 3)).toEqual([10, 10, 10, 255]);
    expect(pixelAt(output, 4, 0)).toEqual([13, 13, 13, 255]);
    expect(pixelAt(output, 4, 3)).toEqual([13, 13, 13, 255]);
    expect(pixelAt(output, 0, 4)).toEqual([23, 23, 23, 255]);
    expect(pixelAt(output, 4, 4)).toEqual([25, 25, 25, 255]);
  });

  it('clamps nearest sampling on partial edge blocks', () => {
    // 5x5 with block size 4: block (4,0) is a single column; center would
    // overflow and must clamp to the last column.
    const pixels: number[] = [];
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        const value = x === 4 ? 77 : 1;
        pixels.push(value, value, value, 255);
      }
    }
    const input = createImage(5, 5, pixels);

    const output = pixelateImage(input, { blockSize: 4, mode: 'nearest' });

    expect(pixelAt(output, 4, 0)).toEqual([77, 77, 77, 255]);
    expect(pixelAt(output, 0, 4)).toEqual([1, 1, 1, 255]);
    expect(pixelAt(output, 4, 4)).toEqual([77, 77, 77, 255]);
  });
});
