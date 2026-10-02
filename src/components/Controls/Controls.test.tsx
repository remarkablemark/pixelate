import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Settings } from 'src/types/settings';
import { DEFAULT_SETTINGS } from 'src/utils/storage';

import { Controls } from '.';
import { PRESETS } from './presets';

function renderControls(overrides: Partial<Settings> = {}, props = {}) {
  const onChange = vi.fn();
  const onReset = vi.fn();
  const onDownload = vi.fn();
  const utils = render(
    <Controls
      hasImage={false}
      onChange={onChange}
      onDownload={onDownload}
      onReset={onReset}
      settings={{ ...DEFAULT_SETTINGS, ...overrides }}
      sourceFormat={null}
      {...props}
    />,
  );
  return { ...utils, onChange, onReset, onDownload };
}

describe('Controls', () => {
  it('renders every preset', () => {
    renderControls();

    for (const preset of PRESETS) {
      expect(
        screen.getByRole('button', { name: preset.name }),
      ).toBeInTheDocument();
    }
  });

  it('applies a preset', async () => {
    const user = userEvent.setup();
    const { onChange } = renderControls();

    await user.click(screen.getByRole('button', { name: '8-bit' }));

    expect(onChange).toHaveBeenCalledWith({
      blockSize: 8,
      mode: 'average',
      colorReductionEnabled: true,
      maxColors: 16,
    });
  });

  it('emits block size changes', () => {
    const { onChange } = renderControls();
    const slider = screen.getByLabelText(/block size/i);

    fireEvent.change(slider, { target: { value: '20' } });

    expect(onChange).toHaveBeenCalledWith({ blockSize: 20 });
  });

  it('emits brightness, contrast, and saturation changes', () => {
    const { onChange } = renderControls();

    fireEvent.change(screen.getByLabelText(/brightness/i), {
      target: { value: '150' },
    });
    fireEvent.change(screen.getByLabelText(/contrast/i), {
      target: { value: '80' },
    });
    fireEvent.change(screen.getByLabelText(/saturation/i), {
      target: { value: '30' },
    });

    expect(onChange).toHaveBeenCalledWith({ brightness: 150 });
    expect(onChange).toHaveBeenCalledWith({ contrast: 80 });
    expect(onChange).toHaveBeenCalledWith({ saturation: 30 });
  });

  it('emits a switch to nearest sampling', async () => {
    const user = userEvent.setup();
    const { onChange } = renderControls();

    await user.click(screen.getByLabelText('Nearest'));

    expect(onChange).toHaveBeenCalledWith({ mode: 'nearest' });
  });

  it('emits a switch to average sampling', async () => {
    const user = userEvent.setup();
    const { onChange } = renderControls({ mode: 'nearest' });

    await user.click(screen.getByLabelText('Average'));

    expect(onChange).toHaveBeenCalledWith({ mode: 'average' });
  });

  it('emits color reduction changes', async () => {
    const user = userEvent.setup();
    const { onChange } = renderControls();

    await user.click(screen.getByLabelText('Reduce colors'));
    expect(onChange).toHaveBeenCalledWith({ colorReductionEnabled: true });
  });

  it('disables the palette slider until color reduction is on', () => {
    const { rerender } = renderControls();
    const slider = screen.getByLabelText(/palette size/i);
    expect(slider).toBeDisabled();

    rerender(
      <Controls
        hasImage
        onChange={vi.fn()}
        onDownload={vi.fn()}
        onReset={vi.fn()}
        settings={{ ...DEFAULT_SETTINGS, colorReductionEnabled: true }}
        sourceFormat={null}
      />,
    );

    expect(screen.getByLabelText(/palette size/i)).not.toBeDisabled();
  });

  it('emits palette size changes', () => {
    const { onChange } = renderControls({ colorReductionEnabled: true });

    fireEvent.change(screen.getByLabelText(/palette size/i), {
      target: { value: '128' },
    });

    expect(onChange).toHaveBeenCalledWith({ maxColors: 128 });
  });

  it('emits format changes', () => {
    const { onChange } = renderControls();

    fireEvent.change(screen.getByLabelText('Format'), {
      target: { value: 'webp' },
    });

    expect(onChange).toHaveBeenCalledWith({ format: 'webp' });
  });

  it('selects the matching option', () => {
    const { rerender } = renderControls();
    expect(screen.getByLabelText('Format')).toHaveValue('png');

    rerender(
      <Controls
        hasImage
        onChange={vi.fn()}
        onDownload={vi.fn()}
        onReset={vi.fn()}
        settings={DEFAULT_SETTINGS}
        sourceFormat="jpeg"
      />,
    );

    expect(screen.getByLabelText('Format')).toHaveValue('jpeg');
  });

  it('keeps an explicit format when the source is different', () => {
    renderControls({ format: 'webp' }, { sourceFormat: 'jpeg' });

    expect(screen.getByLabelText('Format')).toHaveValue('webp');
  });

  it('disables download until an image is ready', async () => {
    const user = userEvent.setup();
    const { onDownload, rerender } = renderControls();
    const button = screen.getByRole('button', { name: 'Download' });
    expect(button).toBeDisabled();

    await user.click(button);
    expect(onDownload).not.toHaveBeenCalled();

    rerender(
      <Controls
        hasImage
        onChange={vi.fn()}
        onDownload={onDownload}
        onReset={vi.fn()}
        settings={DEFAULT_SETTINGS}
        sourceFormat={null}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Download' }));
    expect(onDownload).toHaveBeenCalledTimes(1);
  });

  it('emits reset', async () => {
    const user = userEvent.setup();
    const { onReset } = renderControls();

    await user.click(screen.getByRole('button', { name: 'Reset settings' }));

    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('reflects the current settings', () => {
    renderControls({
      blockSize: 24,
      mode: 'nearest',
      brightness: 150,
      colorReductionEnabled: true,
      maxColors: 32,
      format: 'webp',
    });

    expect(screen.getByLabelText(/block size/i)).toHaveValue('24');
    expect(screen.getByLabelText('Nearest')).toBeChecked();
    expect(screen.getByLabelText(/brightness/i)).toHaveValue('150');
    expect(screen.getByLabelText('Reduce colors')).toBeChecked();
    expect(screen.getByLabelText(/palette size/i)).toHaveValue('32');
    expect(screen.getByLabelText('Format')).toHaveValue('webp');
  });
});
