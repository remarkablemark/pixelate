export interface ImageCompareProps {
  original: ImageData | null;
  result: ImageData | null;
}

interface PaneProps {
  imageData: ImageData | null;
  label: string;
}

function Pane({ imageData, label }: PaneProps) {
  function attach(canvas: HTMLCanvasElement | null): void {
    if (canvas && imageData) {
      canvas.width = imageData.width;
      canvas.height = imageData.height;
      const context = canvas.getContext('2d');
      context?.putImageData(imageData, 0, 0);
    }
  }

  return (
    <figure className="min-w-0">
      <figcaption className="mb-2 text-sm font-medium text-slate-600 dark:text-slate-300">
        {label}
      </figcaption>
      <canvas
        aria-label={label}
        className={`block w-full rounded-md border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800 ${
          imageData ? '' : 'hidden'
        }`}
        ref={attach}
        role="img"
      />
    </figure>
  );
}

export function ImageCompare({ original, result }: ImageCompareProps) {
  return (
    <div className="space-y-4">
      {original === null && result === null && (
        <p
          className="rounded-md bg-slate-100 p-6 text-center text-sm text-slate-500 dark:bg-slate-800 dark:text-slate-400"
          role="status"
        >
          Upload an image to see the before and after.
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Pane imageData={original} label="Original" />
        <Pane imageData={result} label="Pixelated" />
      </div>
    </div>
  );
}
