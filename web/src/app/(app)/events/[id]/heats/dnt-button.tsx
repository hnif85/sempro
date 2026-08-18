"use client";

import { useTransition } from "react";
import { finalizeDNS } from "./actions";

export default function DNTButton({ ids, eventId }: { ids: string[]; eventId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={ids.length === 0 || pending}
      onClick={() => {
        const formData = new FormData();
        formData.set("event_id", eventId);
        formData.set("ids", JSON.stringify(ids));
        startTransition(() => finalizeDNS(formData));
      }}
      className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
    >
      {pending ? "Memproses…" : `Finalisasi DNS → DNT (${ids.length})`}
    </button>
  );
}