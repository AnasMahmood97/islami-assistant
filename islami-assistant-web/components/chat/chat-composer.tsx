"use client";

import { SendHorizontal } from "lucide-react";

export function ChatComposer({
  text,
  loading,
  uploadingImage,
  selectedImageName,
  onTextChange,
  onImageSelect,
  onSend,
}: {
  text: string;
  loading: boolean;
  uploadingImage: boolean;
  selectedImageName: string | null;
  onTextChange: (value: string) => void;
  onImageSelect: (file: File | null) => void;
  onSend: () => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label className="cursor-pointer rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-700 hover:bg-slate-50">
          إرفاق صورة
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={loading || uploadingImage}
            onChange={(e) => onImageSelect(e.target.files?.[0] ?? null)}
          />
        </label>
        {uploadingImage ? <span className="text-xs text-slate-500">جاري رفع الصورة...</span> : null}
        {!uploadingImage && selectedImageName ? <span className="text-xs text-slate-500">{selectedImageName}</span> : null}
      </div>
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
          disabled={loading || uploadingImage}
          className="flex items-center gap-1 rounded-full bg-[#E60000] px-4 py-2.5 text-white disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "..." : "إرسال"}
          {!loading ? <SendHorizontal className="h-4 w-4" /> : null}
        </button>
      </div>
    </div>
  );
}
