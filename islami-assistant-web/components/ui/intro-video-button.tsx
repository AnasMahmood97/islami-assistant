"use client";

import { useState } from "react";

export function IntroVideoButton({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`rounded-xl border border-[#FF7F00]/40 bg-white px-3 py-2 text-sm font-semibold text-[#b65600] shadow-sm transition hover:bg-orange-50 ${className}`}
      >
        تعريف بالمساعد الشخصي
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <div className="glass-card w-full max-w-4xl bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#b65600]">شاهد العرض التعريفي</h3>
              <button type="button" className="rounded-lg bg-orange-100 px-3 py-1 text-sm" onClick={() => setOpen(false)}>
                إغلاق
              </button>
            </div>
            <video src="/intro.mp4" controls className="max-h-[75vh] w-full rounded-2xl bg-black" />
          </div>
        </div>
      ) : null}
    </>
  );
}
