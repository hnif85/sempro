"use client";

import { useEffect, useState } from "react";

function diff(target: number) {
  const total = Math.max(0, target - Date.now());
  const days = Math.floor(total / 86400000);
  const hours = Math.floor((total % 86400000) / 3600000);
  const minutes = Math.floor((total % 3600000) / 60000);
  const seconds = Math.floor((total % 60000) / 1000);
  return { days, hours, minutes, seconds, done: total === 0 };
}

export default function Countdown({ target }: { target: string }) {
  const [state, setState] = useState(() => diff(new Date(target).getTime()));
  useEffect(() => {
    const id = setInterval(() => setState(diff(new Date(target).getTime())), 1000);
    return () => clearInterval(id);
  }, [target]);

  if (state.done) {
    return <p className="text-sm font-semibold text-[#53d8ff]">Event sedang berlangsung / telah selesai</p>;
  }

  const items = [
    { value: state.days, label: "Hari" },
    { value: state.hours, label: "Jam" },
    { value: state.minutes, label: "Menit" },
    { value: state.seconds, label: "Detik" },
  ];

  return (
    <div className="flex gap-3">
      {items.map((item) => (
        <div key={item.label} className="flex w-16 flex-col items-center rounded-xl bg-white/10 px-2 py-3 backdrop-blur">
          <span className="text-2xl font-black tabular-nums text-white sm:text-3xl">
            {String(item.value).padStart(2, "0")}
          </span>
          <span className="mt-1 text-[10px] font-medium uppercase tracking-wide text-blue-100/70">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
