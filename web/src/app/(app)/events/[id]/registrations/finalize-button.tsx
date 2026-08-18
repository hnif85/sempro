"use client";

import { useTransition } from "react";
import { finalizeRegistrations } from "./actions";

export default function FinalizeButton({
  ids,
  eventId,
}: {
  ids: string[];
  eventId: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={ids.length === 0 || pending}
      onClick={() => {
        const formData = new FormData();
        formData.set("event_id", eventId);
        formData.set("ids", JSON.stringify(ids));
        startTransition(() => finalizeRegistrations(formData));
      }}
      className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
    >
      {pending ? "Memproses…" : `Finalisasi & Generate Invoice (${ids.length})`}
    </button>
  );
}