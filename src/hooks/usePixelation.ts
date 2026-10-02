import { useEffect, useState } from 'react';
import {
  downloadBlob,
  exportCanvas,
  getSourceFormat,
  imageDataToCanvas,
  imageToImageData,
  loadImageFromFile,
  resolveFormat,
} from 'src/services/image';
import type { OutputFormat, Settings } from 'src/types/settings';
import { adjustImage } from 'src/utils/adjust';
import { pixelateImage } from 'src/utils/pixelate';
import { quantizeImage } from 'src/utils/quantize';
import {
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
} from 'src/utils/storage';

interface SourceImage {
  imageData: ImageData;
  format: OutputFormat;
  name: string;
}

export interface PixelationState {
  settings: Settings;
  original: ImageData | null;
  sourceFormat: OutputFormat | null;
  output: ImageData | null;
  error: string | null;
  updateSettings: (patch: Partial<Settings>) => void;
  resetSettings: () => void;
  handleFile: (file: File) => Promise<void>;
  download: () => Promise<void>;
}

function runPipeline(imageData: ImageData, settings: Settings): ImageData {
  const adjusted = adjustImage(imageData, settings);
  const pixelated = pixelateImage(adjusted, settings);
  return settings.colorReductionEnabled
    ? quantizeImage(pixelated, settings.maxColors)
    : pixelated;
}

/**
 * Owns the source image and settings, derives the pixelation output during
 * render, and persists settings to local storage.
 */
export function usePixelation(): PixelationState {
  const [settings, setSettings] = useState<Settings>(() => loadSettings());
  const [source, setSource] = useState<SourceImage | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const output = source ? runPipeline(source.imageData, settings) : null;

  function updateSettings(patch: Partial<Settings>): void {
    setSettings((current) => ({ ...current, ...patch }));
  }

  function resetSettings(): void {
    setSettings({ ...DEFAULT_SETTINGS });
  }

  async function handleFile(file: File): Promise<void> {
    setError(null);
    if (file.type && !file.type.startsWith('image/')) {
      setError('That file is not an image.');
      return;
    }
    try {
      const image = await loadImageFromFile(file);
      setSource({
        imageData: imageToImageData(image),
        format: getSourceFormat(file),
        name: file.name,
      });
    } catch {
      setError('Could not load that image. Try a PNG, JPEG, or WebP.');
    }
  }

  async function download(): Promise<void> {
    if (!source || !output) return;
    const format = resolveFormat(settings.format, source.format);
    const canvas = imageDataToCanvas(output);
    const blob = await exportCanvas(canvas, format);
    const baseName = source.name.replace(/\.[^.]+$/, '');
    downloadBlob(blob, `${baseName}-pixelated`);
  }

  return {
    settings,
    original: source?.imageData ?? null,
    sourceFormat: source?.format ?? null,
    output,
    error,
    updateSettings,
    resetSettings,
    handleFile,
    download,
  };
}
