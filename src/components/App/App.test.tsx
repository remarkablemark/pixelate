import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { anchorClickMock } from 'src/setupTests';
import { loadSettings } from 'src/utils/storage';

import { App } from '.';

async function uploadImage(
  user: ReturnType<typeof userEvent.setup>,
  file: File,
): Promise<void> {
  await user.upload(screen.getByLabelText('Choose an image'), file);
  await waitFor(() => {
    expect(screen.getByLabelText('After')).toHaveAttribute('width', '8');
  });
}

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders the dropzone, controls, and empty preview', () => {
    render(<App />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Pixelate' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Choose an image')).toBeInTheDocument();
    expect(
      screen.getByText('Upload an image to see the before and after.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '8-bit' })).toBeInTheDocument();
    expect(screen.getByLabelText(/block size/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Download' })).toBeDisabled();
  });

  it('pixelates an uploaded image and enables download', async () => {
    const user = userEvent.setup();
    render(<App />);

    await uploadImage(user, new File(['x'], 'cat.png', { type: 'image/png' }));

    expect(screen.getByLabelText('Before')).toHaveAttribute('width', '8');
    expect(screen.getByRole('button', { name: 'Download' })).toBeEnabled();
    expect(
      screen.queryByText('Upload an image to see the before and after.'),
    ).not.toBeInTheDocument();
  });

  it('shows an error for files that are not images', async () => {
    const user = userEvent.setup({ applyAccept: false });
    render(<App />);

    await user.upload(
      screen.getByLabelText('Choose an image'),
      new File(['notes'], 'notes.txt', { type: 'text/plain' }),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'That file is not an image.',
    );
    expect(screen.getByRole('button', { name: 'Download' })).toBeDisabled();
  });

  it('applies a preset to the controls', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Censor' }));

    expect(screen.getByLabelText(/block size/i)).toHaveValue('48');
  });

  it('downloads the pixelated image', async () => {
    const user = userEvent.setup();
    render(<App />);

    await uploadImage(
      user,
      new File(['x'], 'photo.png', { type: 'image/png' }),
    );
    await user.click(screen.getByRole('button', { name: 'Download' }));

    await waitFor(() => {
      expect(anchorClickMock).toHaveBeenCalledTimes(1);
    });
    const anchor = anchorClickMock.mock.contexts[0] as HTMLAnchorElement;
    expect(anchor.download).toBe('photo-pixelated.png');
  });

  it('persists settings to local storage', async () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText(/block size/i), {
      target: { value: '20' },
    });

    await waitFor(() => {
      expect(loadSettings().blockSize).toBe(20);
    });
  });
});
