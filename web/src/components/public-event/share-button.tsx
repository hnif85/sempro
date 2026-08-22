"use client";

import { useState } from "react";

export default function ShareButton({ title, className = "" }: { title: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const text = `Yuk ikuti ${title}!\n${url}`;
    const wa = `https://wa.me/?text=${encodeURIComponent(text)}`;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // fall through to copy
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.open(wa, "_blank", "noopener");
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      className={className}
    >
      {copied ? "Tautan disalin ✓" : "Share Event"}
    </button>
  );
}
