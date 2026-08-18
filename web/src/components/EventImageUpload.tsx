"use client";

import { useRef, useState } from "react";

type Props = {
  name?: string;
  accept?: string;
  currentUrl?: string | null;
};

export default function EventImageUpload({
  name = "banner_image",
  accept = "image/png,image/jpeg,image/webp",
  currentUrl,
}: Props) {
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const [fileName, setFileName] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      setPreview(currentUrl ?? null);
      setFileName("");
      return;
    }
    setPreview(URL.createObjectURL(file));
    setFileName(file.name);
  }

  return (
    <div>
      <label className="mb-1 block text-sm font-medium">Gambar Banner</label>
      <div className="flex items-center gap-4">
        <div className="relative h-24 w-40 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Preview banner" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-xs text-zinc-400">
              Belum ada gambar
            </span>
          )}
        </div>
        <div className="flex-1">
          <input
            ref={inputRef}
            type="file"
            name={name}
            accept={accept}
            onChange={handleChange}
            className="block w-full text-sm text-zinc-600 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-primary-dark"
          />
          {fileName && (
            <p className="mt-1 truncate text-xs text-zinc-500">Terpilih: {fileName}</p>
          )}
          {currentUrl && (
            <label className="mt-2 flex items-center gap-1.5 text-xs text-zinc-500">
              <input type="checkbox" name="remove_banner" value="1" className="rounded border-zinc-300" />
              Hapus gambar banner saat ini
            </label>
          )}
        </div>
      </div>
    </div>
  );
}