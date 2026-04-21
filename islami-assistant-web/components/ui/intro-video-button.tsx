"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, X } from "lucide-react";

interface IntroVideoButtonProps {
  className?: string;
}

export function IntroVideoButton({ className }: IntroVideoButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        type="button"
        onClick={() => setIsOpen(true)}
        className={`flex items-center justify-center gap-2 px-3 py-2 rounded-full border border-[#E60000] text-[#E60000] hover:bg-[#E60000] hover:text-white transition-all text-xs font-bold ${className}`}
      >
        <Play className="h-3 w-3 fill-current" />
        تعريف بالمساعد الشخصي
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" style={{ direction: "ltr" }}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white rounded-2xl overflow-hidden shadow-2xl max-w-3xl w-full"
            >
              <button 
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black text-white rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              
              <video 
                src="/videos/intro.mp4" 
                controls 
                autoPlay 
                className="w-full aspect-video"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
