import type { FormatSetting, SamplingMode, Settings } from 'src/types/settings';

export const SETTINGS_STORAGE_KEY = 'pixelate:settings:v1';

export const DEFAULT_SETTINGS: Settings = {
  blockSize: 8,
  mode: 'average',
  brightness: 100,
  contrast: 100,
  saturation: 100,
  colorReductionEnabled: false,
  maxColors: 64,
  format: 'auto',
};

function clampNumber(
  value: unknown,
  min: number,
  max: number,
  fallback: number,
): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}

function isMode(value: unknown): value is SamplingMode {
  return value === 'average' || value === 'nearest';
}

function isFormat(value: unknown): value is FormatSetting {
  return (
    value === 'auto' || value === 'png' || value === 'webp' || value === 'jpeg'
  );
}

/**
 * Coerces an arbitrary value into a valid settings object, falling back to
 * defaults for missing, malformed, or out-of-range values.
 */
export function sanitizeSettings(value: unknown): Settings {
  if (typeof value !== 'object' || value === null) {
    return { ...DEFAULT_SETTINGS };
  }

  const input = value as Partial<Record<keyof Settings, unknown>>;

  return {
    blockSize: clampNumber(input.blockSize, 1, 64, DEFAULT_SETTINGS.blockSize),
    mode: isMode(input.mode) ? input.mode : DEFAULT_SETTINGS.mode,
    brightness: clampNumber(
      input.brightness,
      0,
      200,
      DEFAULT_SETTINGS.brightness,
    ),
    contrast: clampNumber(input.contrast, 0, 200, DEFAULT_SETTINGS.contrast),
    saturation: clampNumber(
      input.saturation,
      0,
      200,
      DEFAULT_SETTINGS.saturation,
    ),
    colorReductionEnabled: input.colorReductionEnabled === true,
    maxColors: clampNumber(input.maxColors, 2, 256, DEFAULT_SETTINGS.maxColors),
    format: isFormat(input.format) ? input.format : DEFAULT_SETTINGS.format,
  };
}

/**
 * Reads persisted settings, falling back to defaults when storage is
 * unavailable or contains invalid data.
 */
export function loadSettings(storage?: Storage): Settings {
  try {
    const store = storage ?? globalThis.localStorage;
    const raw = store.getItem(SETTINGS_STORAGE_KEY);
    if (raw === null) return { ...DEFAULT_SETTINGS };
    return sanitizeSettings(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

/**
 * Persists settings. Failures (quota, private mode) are swallowed.
 */
export function saveSettings(settings: Settings, storage?: Storage): void {
  try {
    const store = storage ?? globalThis.localStorage;
    store.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify(sanitizeSettings(settings)),
    );
  } catch {
    // storage unavailable; settings simply do not persist
  }
}
