"use client";

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
    <div className="flex gap-2">
      <input
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onSend()}
        className="flex-1 rounded-lg border border-slate-300 px-3 py-2"
        placeholder="اكتب سؤالك..."
      />
      <button type="button" onClick={onSend} disabled={loading} className="rounded-lg bg-[#9e1b1f] px-4 py-2 text-white">
        {loading ? "..." : "إرسال"}
      </button>
    </div>
  );
}
