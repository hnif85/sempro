"use client";

import { useState, useTransition } from "react";
import { saveResults } from "./actions";

export default function ResultInputForm({
  heatId,
  eventId,
  entries,
}: {
  heatId: string;
  eventId: string;
  entries: { id: string; athlete: string; lane: number; result_time: string; status: string }[];
}) {
  const [values, setValues] = useState<Record<string, { time: string; status: string }>>(
    Object.fromEntries(
      entries.map((e) => [e.id, { time: e.result_time ?? "", status: e.status }])
    )
  );
  const [pending, startTransition] = useTransition();

  function update(id: string, key: "time" | "status", value: string) {
    setValues((prev) => ({
      ...prev,
      [id]: { ...prev[id], [key]: value },
    }));
  }

  function submit() {
    const formData = new FormData();
    formData.set("event_id", eventId);
    formData.set("heat_id", heatId);
    formData.set(
      "entries",
      JSON.stringify(
        entries.map((e) => ({
          id: e.id,
          result_time: values[e.id]?.time ?? "",
          status: values[e.id]?.status ?? "registered",
        }))
      )
    );
    startTransition(() => saveResults(formData));
  }

  return (
    <div>
      <table className="w-full text-sm">
        <thead className="text-left text-xs text-zinc-500">
          <tr>
            <th className="px-4 py-2 font-medium">Lint</th>
            <th className="px-4 py-2 font-medium">Atlet</th>
            <th className="px-4 py-2 font-medium">Status</th>
            <th className="px-4 py-2 font-medium">Waktu (detik)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-50">
          {entries.map((e) => (
            <tr key={e.id}>
              <td className="px-4 py-2">{e.lane}</td>
              <td className="px-4 py-2 font-medium">{e.athlete}</td>
              <td className="px-4 py-2">
                <select
                  value={values[e.id]?.status ?? "registered"}
                  onChange={(ev) => update(e.id, "status", ev.target.value)}
                  className="rounded border border-zinc-200 px-2 py-1 text-xs"
                >
                  <option value="registered">Terdaftar</option>
                  <option value="hadir">Hadir</option>
                  <option value="dns">DNS</option>
                  <option value="selesai">Selesai</option>
                </select>
              </td>
              <td className="px-4 py-2">
                <input
                  value={values[e.id]?.time ?? ""}
                  onChange={(ev) => update(e.id, "time", ev.target.value)}
                  placeholder="34.21"
                  className="w-24 rounded border border-zinc-200 px-2 py-1 text-sm"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex justify-end gap-2 border-t border-zinc-100 px-4 py-3">
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50"
        >
          {pending ? "Menyimpan…" : "Simpan & Ranking"}
        </button>
      </div>
    </div>
  );
}