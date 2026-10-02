import { render, screen } from '@testing-library/react';
import { context2dMock } from 'src/setupTests';

import { ImageCompare } from '.';

function createImageData(width: number, height: number): ImageData {
  return new ImageData(
    new Uint8ClampedArray(width * height * 4),
    width,
    height,
  );
}

describe('ImageCompare', () => {
  it('shows an empty state when there is no image', () => {
    render(<ImageCompare original={null} result={null} />);

    expect(
      screen.getByText('Upload an image to see the before and after.'),
    ).toBeInTheDocument();
    expect(context2dMock.putImageData).not.toHaveBeenCalled();
  });

  it('draws both the original and the result', () => {
    const original = createImageData(4, 2);
    const result = createImageData(2, 2);

    render(<ImageCompare original={original} result={result} />);

    expect(
      screen.queryByText('Upload an image to see the before and after.'),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText('Original')).toBeInTheDocument();
    expect(screen.getByLabelText('Pixelated')).toBeInTheDocument();
    expect(screen.getByLabelText('Original')).toHaveAttribute('width', '4');
    expect(screen.getByLabelText('Original')).toHaveAttribute('height', '2');
    expect(screen.getByLabelText('Pixelated')).toHaveAttribute('width', '2');
    expect(context2dMock.putImageData).toHaveBeenCalledTimes(2);
    expect(context2dMock.putImageData).toHaveBeenCalledWith(original, 0, 0);
    expect(context2dMock.putImageData).toHaveBeenCalledWith(result, 0, 0);
  });

  it('renders when only the result is present', () => {
    const result = createImageData(2, 2);

    render(<ImageCompare original={null} result={result} />);

    expect(
      screen.queryByText('Upload an image to see the before and after.'),
    ).not.toBeInTheDocument();
    expect(context2dMock.putImageData).toHaveBeenCalledWith(result, 0, 0);
  });

  it('skips drawing when a 2d context is unavailable', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValueOnce(
      null,
    );

    render(<ImageCompare original={createImageData(2, 2)} result={null} />);

    expect(context2dMock.putImageData).not.toHaveBeenCalled();
  });

  it('stops drawing after unmount', () => {
    const { unmount } = render(
      <ImageCompare original={createImageData(2, 2)} result={null} />,
    );
    expect(context2dMock.putImageData).toHaveBeenCalledTimes(1);

    unmount();

    expect(context2dMock.putImageData).toHaveBeenCalledTimes(1);
  });
});
