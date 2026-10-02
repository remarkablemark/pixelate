import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ImageDropzone } from '.';

function getFile(): File {
  return new File(['content'], 'cat.png', { type: 'image/png' });
}

describe('ImageDropzone', () => {
  it('renders a file picker and drop hint', () => {
    render(<ImageDropzone error={null} onFile={vi.fn()} />);

    expect(screen.getByLabelText('Choose an image')).toBeInTheDocument();
    expect(screen.getByText(/drag & drop it here/i)).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('emits the selected file', async () => {
    const user = userEvent.setup();
    const onFile = vi.fn();
    render(<ImageDropzone error={null} onFile={onFile} />);

    await user.upload(screen.getByLabelText('Choose an image'), getFile());

    expect(onFile).toHaveBeenCalledTimes(1);
    expect(onFile.mock.calls[0][0]).toMatchObject({ name: 'cat.png' });
  });

  it('ignores an empty selection', () => {
    const onFile = vi.fn();
    render(<ImageDropzone error={null} onFile={onFile} />);

    fireEvent.change(screen.getByLabelText('Choose an image'), {
      target: { files: [] },
    });

    expect(onFile).not.toHaveBeenCalled();
  });

  it('ignores change events without files', () => {
    const onFile = vi.fn();
    render(<ImageDropzone error={null} onFile={onFile} />);

    fireEvent.change(screen.getByLabelText('Choose an image'), {
      target: { files: null },
    });

    expect(onFile).not.toHaveBeenCalled();
  });

  it('emits a dropped file', () => {
    const onFile = vi.fn();
    render(<ImageDropzone error={null} onFile={onFile} />);
    const zone = screen.getByRole('region', { name: 'Image drop zone' });

    fireEvent.drop(zone, { dataTransfer: { files: [getFile()] } });

    expect(onFile).toHaveBeenCalledTimes(1);
  });

  it('ignores drops without files', () => {
    const onFile = vi.fn();
    render(<ImageDropzone error={null} onFile={onFile} />);
    const zone = screen.getByRole('region', { name: 'Image drop zone' });

    fireEvent.drop(zone, { dataTransfer: { files: [] } });

    expect(onFile).not.toHaveBeenCalled();
  });

  it('highlights while dragging and clears on leave and drop', () => {
    render(<ImageDropzone error={null} onFile={vi.fn()} />);
    const zone = screen.getByRole('region', { name: 'Image drop zone' });

    fireEvent.dragOver(zone);
    expect(zone).toHaveClass('border-sky-500');

    fireEvent.dragLeave(zone);
    expect(zone).not.toHaveClass('border-sky-500');

    fireEvent.dragOver(zone);
    fireEvent.drop(zone, { dataTransfer: { files: [] } });
    expect(zone).not.toHaveClass('border-sky-500');
  });

  it('displays an error message', () => {
    render(
      <ImageDropzone error="That file is not an image." onFile={vi.fn()} />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent(
      'That file is not an image.',
    );
  });
});
