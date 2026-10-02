import type { ChangeEvent, DragEvent } from 'react';
import { useId, useState } from 'react';

export interface ImageDropzoneProps {
  error: string | null;
  onFile: (file: File) => void;
}

function firstFile(files: FileList | null): File | undefined {
  return files?.[0];
}

export function ImageDropzone({ error, onFile }: ImageDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputId = useId();

  function handleDragOver(event: DragEvent<HTMLDivElement>): void {
    event.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(): void {
    setIsDragging(false);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>): void {
    event.preventDefault();
    setIsDragging(false);
    const file = firstFile(event.dataTransfer.files);
    if (file) {
      onFile(file);
    }
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>): void {
    const file = firstFile(event.target.files);
    if (file) {
      onFile(file);
    }
    event.target.value = '';
  }

  return (
    <div
      aria-label="Image drop zone"
      className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
        isDragging
          ? 'border-sky-500 bg-sky-50 dark:border-sky-400 dark:bg-slate-800'
          : 'border-slate-300 dark:border-slate-600'
      }`}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      role="region"
    >
      <label
        htmlFor={inputId}
        className="inline-block cursor-pointer rounded-md border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-800 shadow-xs transition-all hover:border-slate-800 focus:border-slate-800 active:border-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-500 dark:focus:border-slate-500 dark:active:border-slate-500"
      >
        Choose an image
      </label>
      <input
        accept="image/*"
        className="sr-only"
        id={inputId}
        onChange={handleChange}
        type="file"
      />
      <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
        or drag &amp; drop it here
      </p>
      {error && (
        <p
          className="mt-3 text-sm font-medium text-red-600 dark:text-red-400"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}
