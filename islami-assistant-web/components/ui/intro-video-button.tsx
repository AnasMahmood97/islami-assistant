"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

export function IntroVideoButton({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`rounded-xl border border-[#9e1b1f]/30 bg-white px-3 py-2 text-sm font-semibold text-[#9e1b1f] shadow-sm transition hover:bg-[#9e1b1f]/10 ${className}`}
      >
        تعريف بالمساعد الشخصي
      </button>
      <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/55 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="glass-card w-full max-w-4xl bg-white p-4"
            initial={{ scale: 0.96, y: 14, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, y: 14, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#E60000]">شاهد العرض التعريفي</h3>
              <button type="button" className="rounded-lg bg-[#E60000]/10 px-3 py-1 text-sm" onClick={() => setOpen(false)}>
                إغلاق
              </button>
            </div>
            <video src="/videos/intro.mp4" controls preload="metadata" className="max-h-[75vh] w-full rounded-2xl bg-black" />
          </motion.div>
        </motion.div>
      ) : null}
      </AnimatePresence>
    </>
  );
}
