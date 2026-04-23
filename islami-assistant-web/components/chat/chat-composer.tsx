"use client";

import { SendHorizontal } from "lucide-react";

export function ChatComposer({
  text,
  loading,
  onTextChange,
  onSend,
}: {
  text: string;
  loading: boolean;
  onTextChange: (value: string) => void;
  onSend: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onSend()}
        className="w-full rounded-full border border-[#E0E0E0] bg-white px-4 py-2.5 text-sm outline-none focus:border-[#E60000]/45"
        placeholder="اكتب سؤالك..."
      />
      <button
        type="button"
        onClick={onSend}
        disabled={loading}
        className="flex items-center gap-1 rounded-full bg-[#E60000] px-4 py-2.5 text-white disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? "..." : "إرسال"}
        {!loading ? <SendHorizontal className="h-4 w-4" /> : null}
      </button>
    </div>
  );
}
