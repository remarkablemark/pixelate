import {
  DEFAULT_SETTINGS,
  loadSettings,
  sanitizeSettings,
  saveSettings,
  SETTINGS_STORAGE_KEY,
} from './storage';

function createMemoryStorage(): Storage {
  const entries = new Map<string, string>();
  return {
    get length() {
      return entries.size;
    },
    clear() {
      entries.clear();
    },
    getItem(key: string) {
      return entries.get(key) ?? null;
    },
    key(index: number) {
      return [...entries.keys()][index] ?? null;
    },
    removeItem(key: string) {
      entries.delete(key);
    },
    setItem(key: string, value: string) {
      entries.set(key, value);
    },
  };
}

describe('storage', () => {
  describe('sanitizeSettings', () => {
    it('returns defaults for non-object values', () => {
      expect(sanitizeSettings(null)).toEqual(DEFAULT_SETTINGS);
      expect(sanitizeSettings('settings')).toEqual(DEFAULT_SETTINGS);
      expect(sanitizeSettings(42)).toEqual(DEFAULT_SETTINGS);
    });

    it('coerces out-of-range and malformed fields', () => {
      const sanitized = sanitizeSettings({
        blockSize: 9999,
        mode: 'bogus',
        brightness: -50,
        contrast: 500,
        saturation: 'loud',
        colorReductionEnabled: 'yes',
        maxColors: 1e9,
        format: 'gif',
        extraField: true,
      });

      expect(sanitized).toEqual({
        ...DEFAULT_SETTINGS,
        blockSize: 64,
        brightness: 0,
        contrast: 200,
        maxColors: 256,
      });
      expect(sanitized).not.toHaveProperty('extraField');
    });

    it('keeps valid values', () => {
      const sanitized = sanitizeSettings({
        blockSize: 24,
        mode: 'nearest',
        brightness: 150,
        contrast: 80,
        saturation: 0,
        colorReductionEnabled: true,
        maxColors: 32,
        format: 'webp',
      });

      expect(sanitized).toEqual({
        blockSize: 24,
        mode: 'nearest',
        brightness: 150,
        contrast: 80,
        saturation: 0,
        colorReductionEnabled: true,
        maxColors: 32,
        format: 'webp',
      });
    });

    it('accepts every valid mode and format', () => {
      expect(sanitizeSettings({ mode: 'average' }).mode).toBe('average');
      expect(sanitizeSettings({ mode: 'nearest' }).mode).toBe('nearest');
      expect(sanitizeSettings({ format: 'auto' }).format).toBe('auto');
      expect(sanitizeSettings({ format: 'png' }).format).toBe('png');
      expect(sanitizeSettings({ format: 'webp' }).format).toBe('webp');
      expect(sanitizeSettings({ format: 'jpeg' }).format).toBe('jpeg');
    });

    it('falls back to defaults for NaN numbers', () => {
      const sanitized = sanitizeSettings({
        blockSize: Number.NaN,
        brightness: Number.NaN,
      });

      expect(sanitized.blockSize).toBe(DEFAULT_SETTINGS.blockSize);
      expect(sanitized.brightness).toBe(DEFAULT_SETTINGS.brightness);
    });
  });

  describe('loadSettings', () => {
    it('returns defaults when nothing is stored', () => {
      expect(loadSettings(createMemoryStorage())).toEqual(DEFAULT_SETTINGS);
    });

    it('returns defaults for corrupt JSON', () => {
      const storage = createMemoryStorage();
      storage.setItem(SETTINGS_STORAGE_KEY, '{not json');

      expect(loadSettings(storage)).toEqual(DEFAULT_SETTINGS);
    });

    it('returns defaults for JSON that is not an object', () => {
      const storage = createMemoryStorage();
      storage.setItem(SETTINGS_STORAGE_KEY, 'null');

      expect(loadSettings(storage)).toEqual(DEFAULT_SETTINGS);
    });

    it('returns defaults when storage access throws', () => {
      const storage = {
        getItem() {
          throw new Error('denied');
        },
      } as unknown as Storage;

      expect(loadSettings(storage)).toEqual(DEFAULT_SETTINGS);
    });

    it('reads settings saved by saveSettings', () => {
      const storage = createMemoryStorage();
      saveSettings(
        { ...DEFAULT_SETTINGS, blockSize: 32, mode: 'nearest' },
        storage,
      );

      expect(loadSettings(storage)).toEqual({
        ...DEFAULT_SETTINGS,
        blockSize: 32,
        mode: 'nearest',
      });
      expect(storage.getItem(SETTINGS_STORAGE_KEY)).toBeTypeOf('string');
    });
  });

  describe('saveSettings', () => {
    it('sanitizes before writing', () => {
      const storage = createMemoryStorage();

      saveSettings(
        { ...DEFAULT_SETTINGS, blockSize: 9999, mode: 'nearest' },
        storage,
      );

      expect(loadSettings(storage).blockSize).toBe(64);
    });

    it('swallows storage failures', () => {
      const storage = {
        setItem() {
          throw new Error('quota exceeded');
        },
      } as unknown as Storage;

      expect(() => {
        saveSettings(DEFAULT_SETTINGS, storage);
      }).not.toThrow();
    });
  });
});
