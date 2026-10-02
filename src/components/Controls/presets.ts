import type { Preset } from 'src/types/settings';

export const PRESETS: Preset[] = [
  {
    name: '8-bit',
    settings: {
      blockSize: 8,
      mode: 'average',
      colorReductionEnabled: true,
      maxColors: 16,
    },
  },
  {
    name: 'Censor',
    settings: { blockSize: 48, colorReductionEnabled: false },
  },
  {
    name: 'Retro 16',
    settings: {
      blockSize: 12,
      mode: 'nearest',
      colorReductionEnabled: true,
      maxColors: 16,
    },
  },
  {
    name: 'Mosaic',
    settings: {
      blockSize: 24,
      mode: 'average',
      colorReductionEnabled: false,
    },
  },
  {
    name: 'Vivid',
    settings: { brightness: 110, contrast: 120, saturation: 140 },
  },
  {
    name: 'Grayscale',
    settings: { saturation: 0 },
  },
];
