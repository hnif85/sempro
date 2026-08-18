"use client";

import { useRef, useState } from "react";

type Props = {
  name?: string;
  currentUrl?: string | null;
};

export default function EventPdfUpload({ name = "pdf_file", currentUrl }: Props) {
  const [fileName, setFileName] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setFileName(file ? file.name : "");
  }

  return (
    <div>
      <label className="mb-1 block text-sm font-medium">File PDF</label>
      <input
        ref={inputRef}
        type="file"
        name={name}
        accept="application/pdf"
        onChange={handleChange}
        className="block w-full text-sm text-zinc-600 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-primary-dark"
      />
      {fileName && <p className="mt-1 truncate text-xs text-zinc-500">Terpilih: {fileName}</p>}
      {currentUrl && !fileName && (
        <div className="mt-2 flex items-center gap-3 text-xs text-zinc-500">
          <a href={currentUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            📄 Lihat PDF saat ini
          </a>
          <label className="flex items-center gap-1.5">
            <input type="checkbox" name="remove_pdf" value="1" className="rounded border-zinc-300" />
            Hapus
          </label>
        </div>
      )}
    </div>
  );
}
