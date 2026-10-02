import { Controls } from 'src/components/Controls';
import { ImageCompare } from 'src/components/ImageCompare';
import { ImageDropzone } from 'src/components/ImageDropzone';
import { usePixelation } from 'src/hooks/usePixelation';

export function App() {
  const {
    settings,
    original,
    sourceFormat,
    output,
    error,
    updateSettings,
    resetSettings,
    handleFile,
    download,
  } = usePixelation();

  return (
    <main className="mx-auto max-w-6xl p-4 sm:p-8">
      <header className="mb-6 text-center">
        <h1 className="text-4xl font-bold">Pixelate</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Pixelate images in your browser — nothing is uploaded.
        </p>
      </header>

      <ImageDropzone
        error={error}
        onFile={(file) => {
          void handleFile(file);
        }}
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-[18rem_1fr]">
        <Controls
          hasImage={output !== null}
          onChange={updateSettings}
          onDownload={() => {
            void download();
          }}
          onReset={resetSettings}
          settings={settings}
          sourceFormat={sourceFormat}
        />
        <ImageCompare original={original} result={output} />
      </div>
    </main>
  );
}
