"use client";

import { useEffect, useRef, useState } from "react";

type Location = {
  id: number;
  label: string;
  province_name: string;
  city_name: string;
  district_name: string;
  subdistrict_name: string;
  zip_code: string;
};

type InitialLocation = Partial<Location> & { label?: string };

export default function LocationPicker({
  fieldPrefix = "loc",
  initial,
  placeholder = "Cari kota / kecamatan…",
}: {
  fieldPrefix?: string;
  initial?: InitialLocation;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Location | null>(
    initial?.id ? (initial as Location) : null
  );
  const [results, setResults] = useState<Location[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function onInput(value: string) {
    setQuery(value);
    setOpen(true);
    if (timer.current) clearTimeout(timer.current);
    if (!value.trim()) {
      setResults([]);
      return;
    }
    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/locations?search=${encodeURIComponent(value.trim())}&limit=10`);
        const json = await res.json();
        setResults(json.data ?? []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);
  }

  function pick(loc: Location) {
    setSelected(loc);
    setQuery("");
    setResults([]);
    setOpen(false);
  }

  function clear() {
    setSelected(null);
    setQuery("");
    setResults([]);
    setOpen(false);
  }

  const display = selected?.label ?? "";

  return (
    <div ref={boxRef} className="relative">
      <input
        type="text"
        value={selected ? display : query}
        onChange={(e) => {
          if (selected) setSelected(null);
          onInput(e.target.value);
        }}
        onFocus={() => {
          if (query.trim()) setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
        placeholder={placeholder}
        className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
        autoComplete="off"
      />

      <input type="hidden" name={`${fieldPrefix}_destination_id`} value={selected?.id ?? ""} />
      <input type="hidden" name={`${fieldPrefix}_label`} value={selected?.label ?? ""} />
      <input type="hidden" name={`${fieldPrefix}_province_name`} value={selected?.province_name ?? ""} />
      <input type="hidden" name={`${fieldPrefix}_city_name`} value={selected?.city_name ?? ""} />
      <input type="hidden" name={`${fieldPrefix}_district_name`} value={selected?.district_name ?? ""} />
      <input type="hidden" name={`${fieldPrefix}_subdistrict_name`} value={selected?.subdistrict_name ?? ""} />
      <input type="hidden" name={`${fieldPrefix}_zip_code`} value={selected?.zip_code ?? ""} />

      {open && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-auto rounded-lg border border-zinc-200 bg-white shadow-lg">
          {loading && <p className="px-3 py-2 text-sm text-zinc-400">Mencari…</p>}
          {!loading && results.length === 0 && query.trim() && (
            <p className="px-3 py-2 text-sm text-zinc-400">Tidak ditemukan.</p>
          )}
          {results.map((loc) => (
            <button
              key={loc.id}
              type="button"
              onClick={() => pick(loc)}
              className="block w-full px-3 py-2 text-left text-sm hover:bg-blue-50"
            >
              {loc.label}
            </button>
          ))}
        </div>
      )}

      {selected !== null && (
        <button
          type="button"
          onClick={clear}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full px-1.5 text-xs text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
          aria-label="Hapus lokasi"
        >
          ✕
        </button>
      )}
    </div>
  );
}
