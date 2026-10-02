export type SamplingMode = 'average' | 'nearest';

export type OutputFormat = 'png' | 'webp' | 'jpeg';

export type FormatSetting = OutputFormat | 'auto';

export interface AdjustSettings {
  brightness: number;
  contrast: number;
  saturation: number;
}

export interface PixelateSettings {
  blockSize: number;
  mode: SamplingMode;
}

export interface Settings extends AdjustSettings, PixelateSettings {
  colorReductionEnabled: boolean;
  maxColors: number;
  format: FormatSetting;
}

export interface Preset {
  name: string;
  settings: Partial<Settings>;
}
