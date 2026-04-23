"use client";

import { useEffect, useState } from "react";
import { AdminSection } from "@/components/ui/admin-section";
import { AnimatePresence, motion } from "framer-motion";
import { Image as ImageIcon, Pencil, Trash2 } from "lucide-react";
import { sanitizeKnowledgeImageUrl } from "@/lib/knowledge-image-url";

type Unknown = { id: string; text: string; createdAt: string; user: { name: string } };
type Knowledge = { id: string; question: string; answer: string; keywords?: string | null; imageUrl?: string | null };

export default function AdminMemoryPage() {
  const [rows, setRows] = useState<Unknown[]>([]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [keywords, setKeywords] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [knowledgeRows, setKnowledgeRows] = useState<Knowledge[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingImageId, setEditingImageId] = useState<string | null>(null);
  const [imageDraft, setImageDraft] = useState("");

  const isValidUploadedPath = (value: string | null) => {
    if (!value) return true;
    if (value === "Knowledge preview") return false;
    return value.startsWith("/uploads/");
  };

  const updateKnowledgeImage = async (id: string, nextImageUrl: string | null) => {
    const res = await fetch(`/api/admin/knowledge/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl: nextImageUrl }),
    });
    if (!res.ok) {
      alert("تعذر تحديث الصورة");
      return false;
    }
    const updated = await res.json();
    setKnowledgeRows((list) => list.map((item) => (item.id === id ? { ...item, imageUrl: updated.imageUrl ?? null } : item)));
    return true;
  };

  const uploadKnowledgeImage = async (id: string, file: File | null) => {
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/uploads", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error ?? "فشل رفع الصورة");
      return;
    }
    const uploadedUrl = sanitizeKnowledgeImageUrl(data.url ?? null);
    if (!isValidUploadedPath(uploadedUrl)) {
      alert("مسار الصورة غير صالح. يجب أن يبدأ بـ /uploads/");
      return;
    }
    setImageDraft(uploadedUrl ?? "");
    await updateKnowledgeImage(id, uploadedUrl);
  };

  const load = async () => {
    const [unknownRes, knowledgeRes] = await Promise.all([
      fetch("/api/unknown-questions"),
      fetch("/api/admin/knowledge"),
    ]);
    setRows(await unknownRes.json());
    setKnowledgeRows(await knowledgeRes.json());
  };

  useEffect(() => {
    void (async () => {
      const [unknownRes, knowledgeRes] = await Promise.all([
        fetch("/api/unknown-questions"),
        fetch("/api/admin/knowledge"),
      ]);
      setRows(await unknownRes.json());
      setKnowledgeRows(await knowledgeRes.json());
    })();
  }, []);

  const addKnowledge = async () => {
    if (imageUrl.trim() === "Knowledge preview") {
      alert("قيمة الصورة غير صالحة. الرجاء رفع صورة حقيقية.");
      return;
    }
    const cleanImageUrl = sanitizeKnowledgeImageUrl(imageUrl);
    if (!isValidUploadedPath(cleanImageUrl)) {
      alert("يجب أن يكون رابط الصورة من نوع /uploads/...");
      return;
    }
    const res = await fetch("/api/admin/knowledge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, answer, keywords: keywords || undefined, imageUrl: cleanImageUrl ?? undefined }),
    });
    if (!res.ok) {
      alert("تعذر الحفظ");
      return;
    }
    setQuestion("");
    setAnswer("");
    setKeywords("");
    setImageUrl("");
    alert("تمت الإضافة إلى ذاكرة الذكاء الاصطناعي.");
  };

  const resolveUnknown = async (u: Unknown) => {
    if (!u.text.trim()) return;
    const res = await fetch("/api/admin/knowledge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: u.text, answer, keywords: keywords || undefined }),
    });
    const item = await res.json();
    await fetch(`/api/unknown-questions/${u.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "RESOLVED", resolvedKnowledgeItemId: item.id }),
    });
    setAnswer("");
    load();
    alert("تم حفظ الإجابة وإغلاق الطلب.");
  };

  return (
    <AdminSection title="ذاكرة الذكاء الاصطناعي">

      <div className="mb-8 grid gap-4 border-b border-slate-200 pb-8 lg:grid-cols-1">
        <form
          className="space-y-2"
          onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const file = fd.get("file");
            if (!(file instanceof File) || file.size === 0) return;
            const res = await fetch("/api/admin/import/knowledge", { method: "POST", body: fd });
            const data = await res.json();
            alert(`تم استيراد ${data.imported ?? 0} سطرًا.`);
          }}
        >
          <h3 className="font-semibold">رفع Excel للأسئلة</h3>
          <input type="file" name="file" accept=".xlsx,.xls" className="text-sm" />
          <button type="submit" className="rounded-lg bg-[#9e1b1f] px-3 py-2 text-sm text-white">
            استيراد
          </button>
        </form>
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-2">
        <input value={question} onChange={(e) => setQuestion(e.target.value)} className="input" placeholder="السؤال" />
        <input value={keywords} onChange={(e) => setKeywords(e.target.value)} className="input" placeholder="كلمات مفتاحية (اختياري، مفصولة بفواصل)" />
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          className="input min-h-[100px] md:col-span-2"
          placeholder="الجواب"
        />
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm text-slate-600">صورة (اختياري)</label>
          <input
            type="file"
            accept="image/*"
            className="text-sm"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const fd = new FormData();
              fd.append("file", file);
              const res = await fetch("/api/uploads", { method: "POST", body: fd });
              if (!res.ok) {
                alert("فشل رفع الصورة");
                return;
              }
              const data = await res.json();
              const uploadedUrl = sanitizeKnowledgeImageUrl(data.url ?? null);
              if (!isValidUploadedPath(uploadedUrl)) {
                alert("فشل اعتماد مسار الصورة. الرجاء إعادة الرفع.");
                return;
              }
              setImageUrl(uploadedUrl ?? "");
            }}
          />
          {imageUrl ? (
            <div className="mt-2 flex items-center gap-2">
              <img src={imageUrl} alt="Knowledge thumbnail" className="h-12 w-12 rounded object-cover" onError={(e) => (e.currentTarget.src = "/placeholder-error.png")} />
              <p className="text-xs text-slate-500">{imageUrl}</p>
              <button
                type="button"
                className="rounded border border-red-300 px-2 py-1 text-xs text-red-700"
                onClick={() => setImageUrl("")}
              >
                حذف الصورة
              </button>
            </div>
          ) : null}
        </div>
        <button type="button" onClick={addKnowledge} className="rounded-lg bg-[#9e1b1f] py-2 text-white md:col-span-2">
          إضافة مباشرة للذاكرة
        </button>
        <button
          type="button"
          className="rounded-lg border border-red-300 py-2 text-red-700 md:col-span-2"
          onClick={async () => {
            const res = await fetch("/api/admin/knowledge/cleanup-images", { method: "POST" });
            const data = await res.json();
            if (!res.ok) {
              alert(data.error ?? "تعذر تنظيف روابط الصور");
              return;
            }
            alert(`تم تنظيف ${data.cleaned ?? 0} رابط صورة غير صالح.`);
            await load();
          }}
        >
          تنظيف روابط الصور غير الصالحة
        </button>
      </div>

      <h3 className="mb-2 font-semibold">أسئلة وردت ولم تُجاب بعد</h3>
      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.id} className="rounded-lg border border-slate-200 p-3 text-sm">
            <p className="font-semibold">{row.text}</p>
            <p className="text-slate-500">
              بواسطة: {row.user?.name ?? "-"} — {new Date(row.createdAt).toLocaleString("ar-JO")}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded bg-slate-100 px-2 py-1"
                onClick={() => setQuestion(row.text)}
              >
                نقل السؤال للحقول أعلاه
              </button>
              <button type="button" className="rounded-lg bg-[#E60000] px-3 py-1 text-white" onClick={() => resolveUnknown(row)}>
                حفظ إجابة وإغلاق الطلب
              </button>
              <button
                type="button"
                className="rounded bg-red-600 px-2 py-1 text-white"
                onClick={async () => {
                  await fetch(`/api/unknown-questions/${row.id}`, { method: "DELETE" });
                  load();
                }}
              >
                حذف
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              اكتب الإجابة في الحقل العام ثم اضغط «حفظ إجابة وإغلاق الطلب» لنفس السؤال.
            </p>
          </div>
        ))}
      </div>
      <div className="mt-8 border-t border-slate-200 pt-4">
        <h3 className="mb-2 font-semibold">الأسئلة المتعلّمة (إدارة)</h3>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {knowledgeRows.slice(0, 100).map((item) => (
            <div key={item.id} className="group rounded-2xl border border-[#E60000]/15 p-3 text-sm">
              {(() => {
                const imageSrc = sanitizeKnowledgeImageUrl(item.imageUrl ?? null);
                return (
                  <>
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold">{item.question}</p>
                {imageSrc ? (
                  <div className="flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-700">
                    <ImageIcon className="h-3.5 w-3.5" />
                    <span>مرئي</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-500">
                    <ImageIcon className="h-3.5 w-3.5" />
                    <span>بدون صورة</span>
                  </div>
                )}
              </div>
              {imageSrc ? (
                <img src={imageSrc} alt="Knowledge thumbnail" className="mt-2 h-12 w-12 rounded border object-cover" onError={(e) => (e.currentTarget.src = "/placeholder-error.png")} />
              ) : null}
              <button type="button" className="mt-2 text-[#9e1b1f] underline" onClick={() => setExpandedId((v) => (v === item.id ? null : item.id))}>
                {expandedId === item.id ? "إخفاء" : "المزيد"}
              </button>
              <AnimatePresence initial={false}>
                {expandedId === item.id ? (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                    className="overflow-hidden"
                  >
                    <p className="mt-1 text-slate-600">{item.answer}</p>
                    <p className="mt-1 text-xs text-slate-500">الكلمات المفتاحية: {item.keywords || "-"}</p>
                    <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <p className={`text-xs font-semibold ${imageSrc ? "text-emerald-700" : "text-slate-500"}`}>
                          {imageSrc ? "لديه صورة" : "بدون صورة"}
                        </p>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            className="rounded p-1 text-slate-700 hover:bg-slate-100"
                            onClick={() => {
                              setEditingImageId(item.id);
                              setImageDraft(item.imageUrl ?? "");
                            }}
                            title="تعديل الصورة"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className="rounded p-1 text-red-600 hover:bg-red-50"
                            onClick={async () => {
                              const ok = await updateKnowledgeImage(item.id, null);
                              if (ok && editingImageId === item.id) {
                                setEditingImageId(null);
                                setImageDraft("");
                              }
                            }}
                            title="حذف الصورة"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      {imageSrc ? (
                        <img src={imageSrc} alt="Knowledge thumbnail" className="mb-2 h-12 w-12 rounded object-cover" onError={(e) => (e.currentTarget.src = "/placeholder-error.png")} />
                      ) : (
                        <p className="mb-2 text-xs text-slate-400">لا توجد صورة مرتبطة بهذا السؤال.</p>
                      )}
                      {editingImageId === item.id ? (
                        <div className="space-y-2">
                          <input
                            className="input"
                            placeholder="رابط الصورة"
                            value={imageDraft}
                            onChange={(e) => setImageDraft(e.target.value)}
                          />
                          <div className="flex flex-wrap items-center gap-2">
                            <label className="cursor-pointer rounded bg-slate-100 px-2 py-1 text-xs hover:bg-slate-200">
                              رفع صورة
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => uploadKnowledgeImage(item.id, e.target.files?.[0] ?? null)}
                              />
                            </label>
                            <button
                              type="button"
                              className="rounded bg-[#9e1b1f] px-2 py-1 text-xs text-white"
                              onClick={async () => {
                                if (imageDraft.trim() === "Knowledge preview") {
                                  alert("لا يمكن حفظ قيمة Knowledge preview كرابط صورة.");
                                  return;
                                }
                                const cleanDraft = sanitizeKnowledgeImageUrl(imageDraft);
                                if (!isValidUploadedPath(cleanDraft)) {
                                  alert("يجب أن يبدأ رابط الصورة بـ /uploads/");
                                  return;
                                }
                                const ok = await updateKnowledgeImage(item.id, cleanDraft ?? null);
                                if (ok) setEditingImageId(null);
                              }}
                            >
                              حفظ الرابط
                            </button>
                            <button type="button" className="rounded bg-slate-200 px-2 py-1 text-xs" onClick={() => setEditingImageId(null)}>
                              إلغاء
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded bg-slate-100 px-2 py-1"
                  onClick={() => {
                    setQuestion(item.question);
                    setAnswer(item.answer);
                    setKeywords(item.keywords ?? "");
                  }}
                >
                  تعديل عبر النموذج
                </button>
                <button
                  type="button"
                  className="text-red-600 admin-hover-action"
                  onClick={async () => {
                    await fetch(`/api/admin/knowledge/${item.id}`, { method: "DELETE" });
                    load();
                  }}
                >
                  حذف
                </button>
              </div>
                  </>
                );
              })()}
            </div>
          ))}
        </div>
      </div>
    </AdminSection>
  );
}
