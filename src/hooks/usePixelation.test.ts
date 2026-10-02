import { act, renderHook, waitFor } from '@testing-library/react';
import {
  anchorClickMock,
  context2dMock,
  createObjectURLMock,
} from 'src/setupTests';
import {
  DEFAULT_SETTINGS,
  loadSettings,
  SETTINGS_STORAGE_KEY,
} from 'src/utils/storage';

import { usePixelation } from './usePixelation';

function createImageFile(type = 'image/png', name = 'cat.png'): File {
  return new File(['content'], name, { type });
}

function createGrayscalePixels(count: number): ImageData {
  const pixels: number[] = [];
  for (let i = 0; i < count; i++) {
    pixels.push(i * 5, i * 5, i * 5, 255);
  }
  return new ImageData(new Uint8ClampedArray(pixels), 8, 6);
}

function distinctColors(imageData: ImageData | null): number {
  expect(imageData).not.toBeNull();
  if (!imageData) return 0;
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

describe('usePixelation', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts with default settings and no image', () => {
    const { result } = renderHook(() => usePixelation());

    expect(result.current.settings).toEqual(DEFAULT_SETTINGS);
    expect(result.current.original).toBeNull();
    expect(result.current.output).toBeNull();
    expect(result.current.sourceFormat).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('restores persisted settings', () => {
    localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({ ...DEFAULT_SETTINGS, blockSize: 24, mode: 'nearest' }),
    );

    const { result } = renderHook(() => usePixelation());

    expect(result.current.settings.blockSize).toBe(24);
    expect(result.current.settings.mode).toBe('nearest');
  });

  it('falls back to defaults when storage is corrupt', () => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, '{not json');

    const { result } = renderHook(() => usePixelation());

    expect(result.current.settings).toEqual(DEFAULT_SETTINGS);
  });

  it('persists settings updates', () => {
    const { result } = renderHook(() => usePixelation());

    act(() => {
      result.current.updateSettings({ blockSize: 32 });
    });

    expect(result.current.settings.blockSize).toBe(32);
    expect(loadSettings().blockSize).toBe(32);
  });

  it('restores defaults on reset', () => {
    const { result } = renderHook(() => usePixelation());

    act(() => {
      result.current.updateSettings({ blockSize: 40, mode: 'nearest' });
    });
    act(() => {
      result.current.resetSettings();
    });

    expect(result.current.settings).toEqual(DEFAULT_SETTINGS);
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('loads an image and runs the pipeline', async () => {
    const { result } = renderHook(() => usePixelation());

    await act(async () => {
      await result.current.handleFile(createImageFile());
    });

    expect(result.current.error).toBeNull();
    expect(result.current.sourceFormat).toBe('png');
    expect(result.current.original?.width).toBe(8);
    expect(result.current.original?.height).toBe(6);
    await waitFor(() => {
      expect(result.current.output).not.toBeNull();
    });
  });

  it('detects the source format of a jpeg file', async () => {
    const { result } = renderHook(() => usePixelation());

    await act(async () => {
      await result.current.handleFile(
        createImageFile('image/jpeg', 'photo.jpg'),
      );
    });

    expect(result.current.sourceFormat).toBe('jpeg');
  });

  it('attempts to decode files without a MIME type', async () => {
    const { result } = renderHook(() => usePixelation());

    await act(async () => {
      await result.current.handleFile(createImageFile('', 'mystery'));
    });

    expect(result.current.error).toBeNull();
    expect(result.current.original).not.toBeNull();
  });

  it('rejects files that are not images', async () => {
    const { result } = renderHook(() => usePixelation());

    await act(async () => {
      await result.current.handleFile(
        new File(['notes'], 'notes.txt', { type: 'text/plain' }),
      );
    });

    expect(result.current.error).toBe('That file is not an image.');
    expect(result.current.original).toBeNull();
    expect(result.current.output).toBeNull();
  });

  it('surfaces decode failures', async () => {
    createObjectURLMock.mockReturnValueOnce('blob:load-error');
    const { result } = renderHook(() => usePixelation());

    await act(async () => {
      await result.current.handleFile(createImageFile());
    });

    expect(result.current.error).toBe(
      'Could not load that image. Try a PNG, JPEG, or WebP.',
    );
    expect(result.current.output).toBeNull();
  });

  it('reduces colors when color reduction is enabled', async () => {
    const { result } = renderHook(() => usePixelation());
    act(() => {
      result.current.updateSettings({
        blockSize: 1,
        colorReductionEnabled: true,
        maxColors: 4,
      });
    });
    context2dMock.getImageData.mockReturnValueOnce(createGrayscalePixels(48));

    await act(async () => {
      await result.current.handleFile(createImageFile());
    });

    expect(distinctColors(result.current.output)).toBeLessThanOrEqual(4);
  });

  it('reruns the pipeline when settings change', async () => {
    context2dMock.getImageData.mockReturnValueOnce(createGrayscalePixels(48));
    const { result } = renderHook(() => usePixelation());

    await act(async () => {
      await result.current.handleFile(createImageFile());
    });
    expect(result.current.output).not.toBeNull();

    act(() => {
      result.current.updateSettings({
        blockSize: 1,
        colorReductionEnabled: true,
        maxColors: 8,
      });
    });

    expect(distinctColors(result.current.output)).toBeLessThanOrEqual(8);
  });

  it('does nothing when downloading without an image', async () => {
    const { result } = renderHook(() => usePixelation());

    await act(async () => {
      await result.current.download();
    });

    expect(createObjectURLMock).not.toHaveBeenCalled();
    expect(anchorClickMock).not.toHaveBeenCalled();
  });

  it('downloads using the source format by default', async () => {
    const { result } = renderHook(() => usePixelation());

    await act(async () => {
      await result.current.handleFile(createImageFile('image/jpeg', 'cat.jpg'));
    });
    await act(async () => {
      await result.current.download();
    });

    const anchor = anchorClickMock.mock.contexts[0] as HTMLAnchorElement;
    expect(anchor.download).toBe('cat-pixelated.jpg');
  });

  it('honors an explicit format override', async () => {
    const { result } = renderHook(() => usePixelation());

    await act(async () => {
      await result.current.handleFile(createImageFile('image/jpeg', 'cat.jpg'));
    });
    act(() => {
      result.current.updateSettings({ format: 'png' });
    });
    await act(async () => {
      await result.current.download();
    });

    const anchor = anchorClickMock.mock.contexts[0] as HTMLAnchorElement;
    expect(anchor.download).toBe('cat-pixelated.png');
  });
});
