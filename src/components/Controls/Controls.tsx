import type { ChangeEvent } from 'react';
import { useId } from 'react';
import { resolveFormat } from 'src/services/image';
import type { OutputFormat, Settings } from 'src/types/settings';

import { PRESETS } from './presets';

export interface ControlsProps {
  settings: Settings;
  sourceFormat: OutputFormat | null;
  hasImage: boolean;
  onChange: (patch: Partial<Settings>) => void;
  onReset: () => void;
  onDownload: () => void;
}

const controlClass =
  'w-full cursor-pointer accent-slate-800 dark:accent-slate-200';

const legendClass =
  'mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400';

export function Controls({
  settings,
  sourceFormat,
  hasImage,
  onChange,
  onReset,
  onDownload,
}: ControlsProps) {
  const brightnessId = useId();
  const contrastId = useId();
  const saturationId = useId();
  const blockSizeId = useId();
  const modeName = useId();
  const averageId = useId();
  const nearestId = useId();
  const maxColorsId = useId();
  const formatId = useId();
  const effectiveFormat = resolveFormat(settings.format, sourceFormat ?? 'png');

  return (
    <div className="space-y-6 rounded-lg border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-700 dark:bg-slate-800/60">
      <fieldset>
        <legend className={legendClass}>Presets</legend>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.name}
              className="cursor-pointer rounded-md border border-slate-300 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-800 transition-colors hover:border-slate-800 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:border-slate-400"
              onClick={() => {
                onChange(preset.settings);
              }}
              type="button"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className={legendClass}>Adjust</legend>
        <div className="space-y-4">
          <div>
            <label
              className="flex justify-between text-sm"
              htmlFor={brightnessId}
            >
              <span>Brightness</span>
              <span>{settings.brightness}%</span>
            </label>
            <input
              className={controlClass}
              id={brightnessId}
              max={200}
              min={0}
              onChange={(event) => {
                onChange({ brightness: Number(event.target.value) });
              }}
              type="range"
              value={settings.brightness}
            />
          </div>
          <div>
            <label
              className="flex justify-between text-sm"
              htmlFor={contrastId}
            >
              <span>Contrast</span>
              <span>{settings.contrast}%</span>
            </label>
            <input
              className={controlClass}
              id={contrastId}
              max={200}
              min={0}
              onChange={(event) => {
                onChange({ contrast: Number(event.target.value) });
              }}
              type="range"
              value={settings.contrast}
            />
          </div>
          <div>
            <label
              className="flex justify-between text-sm"
              htmlFor={saturationId}
            >
              <span>Saturation</span>
              <span>{settings.saturation}%</span>
            </label>
            <input
              className={controlClass}
              id={saturationId}
              max={200}
              min={0}
              onChange={(event) => {
                onChange({ saturation: Number(event.target.value) });
              }}
              type="range"
              value={settings.saturation}
            />
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend className={legendClass}>Pixelate</legend>
        <div className="space-y-4">
          <div>
            <label
              className="flex justify-between text-sm"
              htmlFor={blockSizeId}
            >
              <span>Block size</span>
              <span>{settings.blockSize}px</span>
            </label>
            <input
              className={controlClass}
              id={blockSizeId}
              max={64}
              min={1}
              onChange={(event) => {
                onChange({ blockSize: Number(event.target.value) });
              }}
              type="range"
              value={settings.blockSize}
            />
          </div>
          <div className="flex gap-4 text-sm">
            <label htmlFor={averageId}>
              <input
                checked={settings.mode === 'average'}
                id={averageId}
                name={modeName}
                onChange={() => {
                  onChange({ mode: 'average' });
                }}
                type="radio"
                value="average"
              />{' '}
              Average
            </label>
            <label htmlFor={nearestId}>
              <input
                checked={settings.mode === 'nearest'}
                id={nearestId}
                name={modeName}
                onChange={() => {
                  onChange({ mode: 'nearest' });
                }}
                type="radio"
                value="nearest"
              />{' '}
              Nearest
            </label>
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend className={legendClass}>Colors</legend>
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              checked={settings.colorReductionEnabled}
              onChange={(event) => {
                onChange({ colorReductionEnabled: event.target.checked });
              }}
              type="checkbox"
            />
            Reduce colors
          </label>
          <div>
            <label
              className="flex justify-between text-sm"
              htmlFor={maxColorsId}
            >
              <span>Palette size</span>
              <span>{settings.maxColors}</span>
            </label>
            <input
              className={controlClass}
              disabled={!settings.colorReductionEnabled}
              id={maxColorsId}
              max={256}
              min={2}
              onChange={(event) => {
                onChange({ maxColors: Number(event.target.value) });
              }}
              type="range"
              value={settings.maxColors}
            />
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend className={legendClass}>Download</legend>
        <div className="space-y-3">
          <label className="block text-sm" htmlFor={formatId}>
            Format
          </label>
          <select
            className="w-full cursor-pointer rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800"
            id={formatId}
            onChange={(event: ChangeEvent<HTMLSelectElement>) => {
              onChange({ format: event.target.value as OutputFormat });
            }}
            value={effectiveFormat}
          >
            <option value="png">PNG</option>
            <option value="webp">WebP</option>
            <option value="jpeg">JPEG</option>
          </select>
          <button
            className="w-full cursor-pointer rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700 disabled:pointer-events-none disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
            disabled={!hasImage}
            onClick={onDownload}
            type="button"
          >
            Download
          </button>
          <button
            className="w-full cursor-pointer rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-800 dark:border-slate-600 dark:text-slate-300 dark:hover:border-slate-400"
            onClick={onReset}
            type="button"
          >
            Reset settings
          </button>
        </div>
      </fieldset>
    </div>
  );
}
