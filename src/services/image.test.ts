import {
  anchorClickMock,
  context2dMock,
  createObjectURLMock,
  revokeObjectURLMock,
  toBlobMock,
} from 'src/setupTests';

import {
  downloadBlob,
  exportCanvas,
  getSourceFormat,
  imageDataToCanvas,
  imageToImageData,
  loadImageFromFile,
  resolveFormat,
} from './image';

function createFile(type: string, name = 'photo.png'): File {
  return new File(['content'], name, { type });
}

function createCanvas(width = 4, height = 3): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

describe('getSourceFormat', () => {
  it.each([
    ['image/jpeg', 'jpeg'],
    ['image/jpg', 'jpeg'],
    ['image/webp', 'webp'],
    ['image/png', 'png'],
    ['image/gif', 'png'],
    ['', 'png'],
  ])('maps %s to %s', (type, expected) => {
    expect(getSourceFormat(createFile(type))).toBe(expected);
  });
});

describe('resolveFormat', () => {
  it('uses the source format for the auto setting', () => {
    expect(resolveFormat('auto', 'webp')).toBe('webp');
  });

  it('honors an explicit format', () => {
    expect(resolveFormat('jpeg', 'webp')).toBe('jpeg');
    expect(resolveFormat('png', 'webp')).toBe('png');
  });
});

describe('loadImageFromFile', () => {
  it('resolves with the decoded image and revokes the object URL', async () => {
    await expect(
      loadImageFromFile(createFile('image/png')),
    ).resolves.toBeDefined();
    expect(createObjectURLMock).toHaveBeenCalledTimes(1);
    expect(revokeObjectURLMock).toHaveBeenCalledTimes(1);
  });

  it('rejects when the image fails to decode', async () => {
    createObjectURLMock.mockReturnValueOnce('blob:load-error');

    await expect(loadImageFromFile(createFile('image/png'))).rejects.toThrow(
      'Could not decode image',
    );
    expect(revokeObjectURLMock).toHaveBeenCalledTimes(1);
  });
});

describe('imageToImageData', () => {
  it('draws the image and reads its pixels', () => {
    const image = new Image();
    image.src = 'blob:test';

    const imageData = imageToImageData(image);

    expect(context2dMock.drawImage).toHaveBeenCalledWith(image, 0, 0);
    expect(context2dMock.getImageData).toHaveBeenCalledWith(0, 0, 8, 6);
    expect(imageData.width).toBe(8);
    expect(imageData.height).toBe(6);
    expect(imageData.data).toHaveLength(8 * 6 * 4);
  });

  it('throws when a 2d context is unavailable', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValueOnce(
      null,
    );
    const image = new Image();
    image.src = 'blob:test';

    expect(() => {
      imageToImageData(image);
    }).toThrow('Canvas is not supported');
  });
});

describe('imageDataToCanvas', () => {
  it('renders image data onto a canvas', () => {
    const imageData = new ImageData(
      new Uint8ClampedArray([1, 2, 3, 255]),
      1,
      1,
    );

    const canvas = imageDataToCanvas(imageData);

    expect(canvas.width).toBe(1);
    expect(canvas.height).toBe(1);
    expect(context2dMock.putImageData).toHaveBeenCalledWith(imageData, 0, 0);
  });

  it('throws when a 2d context is unavailable', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValueOnce(
      null,
    );
    const imageData = new ImageData(
      new Uint8ClampedArray([1, 2, 3, 255]),
      1,
      1,
    );

    expect(() => {
      imageDataToCanvas(imageData);
    }).toThrow('Canvas is not supported');
  });
});

describe('exportCanvas', () => {
  it('encodes png at the default quality', async () => {
    const canvas = createCanvas();

    const blob = await exportCanvas(canvas, 'png');

    expect(toBlobMock).toHaveBeenCalledWith(
      expect.any(Function),
      'image/png',
      0.92,
    );
    expect(toBlobMock.mock.contexts[0]).toBe(canvas);
    expect(blob.type).toBe('image/png');
  });

  it('encodes webp at a custom quality', async () => {
    const canvas = createCanvas();

    await exportCanvas(canvas, 'webp', 0.5);

    expect(toBlobMock).toHaveBeenCalledWith(
      expect.any(Function),
      'image/webp',
      0.5,
    );
    expect(toBlobMock.mock.contexts[0]).toBe(canvas);
  });

  it('flattens jpeg exports onto a white background', async () => {
    const canvas = createCanvas(10, 5);

    await exportCanvas(canvas, 'jpeg');

    expect(context2dMock.fillStyle).toBe('#ffffff');
    expect(context2dMock.fillRect).toHaveBeenCalledWith(0, 0, 10, 5);
    expect(context2dMock.drawImage).toHaveBeenCalledWith(canvas, 0, 0);
    expect(toBlobMock).toHaveBeenCalledTimes(1);
    const [, mimeType, quality] = toBlobMock.mock.calls[0];
    const encoded = toBlobMock.mock.contexts[0] as HTMLCanvasElement;
    expect(encoded).not.toBe(canvas);
    expect(encoded.width).toBe(10);
    expect(mimeType).toBe('image/jpeg');
    expect(quality).toBe(0.92);
  });

  it('rejects when the encoder yields nothing', async () => {
    toBlobMock.mockImplementationOnce((callback) => {
      callback(null);
    });

    await expect(exportCanvas(createCanvas(), 'png')).rejects.toThrow(
      'Failed to encode image',
    );
  });
});

describe('downloadBlob', () => {
  it('names the file from the blob type and cleans up the URL', () => {
    downloadBlob(new Blob(['x'], { type: 'image/png' }), 'cat-pixelated');

    expect(createObjectURLMock).toHaveBeenCalledTimes(1);
    expect(anchorClickMock).toHaveBeenCalledTimes(1);
    expect(revokeObjectURLMock).toHaveBeenCalledTimes(1);
    const anchor = anchorClickMock.mock.contexts[0] as HTMLAnchorElement;
    expect(anchor.download).toBe('cat-pixelated.png');
    expect(anchor.href).toBe('blob:mock');
  });

  it.each([
    ['image/webp', 'cat-pixelated.webp'],
    ['image/jpeg', 'cat-pixelated.jpg'],
    ['image/gif', 'cat-pixelated.png'],
    ['', 'cat-pixelated.png'],
  ])('uses %s to pick %s', (type, expected) => {
    downloadBlob(new Blob(['x'], { type }), 'cat-pixelated');

    const anchor = anchorClickMock.mock.contexts[0] as HTMLAnchorElement;
    expect(anchor.download).toBe(expected);
  });
});
