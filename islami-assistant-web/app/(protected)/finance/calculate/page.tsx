"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Download, FileText, ImageIcon, X } from "lucide-react";

type FinanceType = {
  financeType: string;
  label?: string | null;
  imageUrl?: string | null;
  pdfUrl?: string | null;
  imagePath?: string | null;
  pdfPath?: string | null;
};
type FinanceRate = { id: string; financeType: string; salaryType: string; startYear: number; endYear: number; rate: number };
type NumericField = { raw: string; value: number | null; hasLetters: boolean };
type RangeDraft = { key: string; salaryType: string; startYear: string; endYear: string; rate: string };

const SALARY_TYPES = ["راتب محول", "راتب غير محول", "دخل حر"] as const;

function parseNumeric(raw: string): NumericField {
  const hasLetters = /[A-Za-z\u0600-\u06FF]/.test(raw);
  const normalized = raw.replace(/,/g, "").trim();
  if (!normalized) return { raw, value: null, hasLetters };
  const value = Number(normalized);
  return { raw, value: Number.isFinite(value) ? value : null, hasLetters };
}

function isMurabahaName(name: string): boolean {
  return /(مرابح|مرابحة|المرابحة|مرابحه)/.test(name);
}

function isIjaraName(name: string): boolean {
  return /(اجارة|إجارة|الاجارة|الإجارة|اجاره|إجاره)/.test(name);
}

function safe(value: number | null): number {
  return value != null && Number.isFinite(value) ? value : 0;
}

export default function FinanceCalculatorPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  const [types, setTypes] = useState<FinanceType[]>([]);
  const [rates, setRates] = useState<FinanceRate[]>([]);
  const [selectedType, setSelectedType] = useState("");
  const [salaryType, setSalaryType] = useState<string>(SALARY_TYPES[0]);
  const [salary, setSalary] = useState("");
  const [otherDebts, setOtherDebts] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [downPayment, setDownPayment] = useState("");
  const [years, setYears] = useState("");
  const [rate, setRate] = useState("");
  const [rateAuto, setRateAuto] = useState<number | null>(null);
  const [rateRangeHint, setRateRangeHint] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);

  const loadAll = async () => {
    const [cfgData, ratesData] = await Promise.all([
      fetch("/api/admin/finance-type-config").then((r) => r.json()),
      fetch("/api/finance-rates").then((r) => r.json()),
    ]);

    const allRates = Array.isArray(ratesData) ? ratesData : [];
    const cfg = Array.isArray(cfgData) ? cfgData : [];
    const keysFromRates = [...new Set(allRates.map((r: FinanceRate) => r.financeType).filter(Boolean))];
    const keySet = new Set(cfg.map((c: FinanceType) => c.financeType));
    const merged: FinanceType[] = [
      ...cfg,
      ...keysFromRates
        .filter((k) => !keySet.has(k))
        .map((k) => ({ financeType: k, label: k, imageUrl: null, pdfUrl: null, imagePath: null, pdfPath: null })),
    ];

    setTypes(merged);
    setRates(allRates);
    if (!selectedType && merged[0]?.financeType) setSelectedType(merged[0].financeType);
  };

  useEffect(() => {
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const yearsNum = parseNumeric(years).value;
    if (!selectedType || !salaryType || yearsNum == null || yearsNum <= 0) {
      setRateAuto(null);
      return;
    }
    fetch(`/api/finance-rates/lookup?financeType=${encodeURIComponent(selectedType)}&salaryType=${encodeURIComponent(salaryType)}&years=${yearsNum}`)
      .then((r) => r.json())
      .then((d) => {
        const next = d?.rate != null ? Number(d.rate) : null;
        setRateAuto(next);
        setRateRangeHint(d?.startYear != null && d?.endYear != null ? `${d.startYear}-${d.endYear}` : null);
        if (next != null) setRate(String(next));
      })
      .catch(() => {
        setRateAuto(null);
        setRateRangeHint(null);
      });
  }, [selectedType, salaryType, years]);

  useEffect(() => {
    setPdfBlobUrl(null);
    const selected = types.find((t) => t.financeType === selectedType);
    const raw = selected?.pdfPath ?? selected?.pdfUrl;
    if (!raw) return;
    setPdfBlobUrl(raw);
  }, [selectedType, types]);

  const salaryNum = parseNumeric(salary);
  const otherDebtsNum = parseNumeric(otherDebts);
  const itemPriceNum = parseNumeric(itemPrice);
  const downPaymentNum = parseNumeric(downPayment);
  const yearsNum = parseNumeric(years);
  const rateNum = parseNumeric(rate);

  const warningFields = [
    salaryNum,
    otherDebtsNum,
    itemPriceNum,
    downPaymentNum,
    yearsNum,
    rateNum,
  ].some((f) => f.hasLetters);

  const financeAmount = safe(itemPriceNum.value) - safe(downPaymentNum.value);
  const fullPeriodRatePct = safe(yearsNum.value) * safe(rateNum.value);
  const totalProfit = financeAmount * (fullPeriodRatePct / 100);
  const totalWithProfit = financeAmount + totalProfit;
  const currentTypeName = types.find((t) => t.financeType === selectedType)?.financeType ?? selectedType;
  const insuranceBase = isIjaraName(currentTypeName) && !isMurabahaName(currentTypeName) ? financeAmount : totalWithProfit;
  const insurance = 0.005 * safe(yearsNum.value) * insuranceBase;
  const bankProfit = totalWithProfit - financeAmount;
  const monthlyWithInsurance = safe(yearsNum.value) > 0 ? (totalWithProfit + insurance) / (safe(yearsNum.value) * 12) : 0;
  const monthlyWithoutInsurance = safe(yearsNum.value) > 0 ? totalWithProfit / (safe(yearsNum.value) * 12) : 0;
  const ratioWith = safe(salaryNum.value) > 0 ? (monthlyWithInsurance + safe(otherDebtsNum.value)) / safe(salaryNum.value) : 0;
  const ratioWithout = safe(salaryNum.value) > 0 ? (monthlyWithoutInsurance + safe(otherDebtsNum.value)) / safe(salaryNum.value) : 0;
  const sumWith = totalWithProfit + insurance;
  const sumWithout = totalWithProfit;

  const statusWith = ratioWith <= 0.5 ? "ACCEPT" : "REJECT";
  const statusWithout = ratioWithout <= 0.5 ? "ACCEPT" : "REJECT";

  const selectedTypeMedia = types.find((t) => t.financeType === selectedType);

  const clearAll = () => {
    setSalary("");
    setOtherDebts("");
    setItemPrice("");
    setDownPayment("");
    setYears("");
    setRate("");
    setRateAuto(null);
  };

  return (
    <section className="chat-pane">
      <h2 className="mb-4 text-3xl font-bold text-[#E60000]">احتساب معاملة</h2>

      {warningFields ? (
        <p className="mb-3 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          تنبيه: بعض الحقول تحتوي على أحرف. الرجاء إدخال أرقام فقط في الحقول الرقمية.
        </p>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1.45fr_1fr]">
        <div className="rounded-2xl border border-[#E60000]/20 bg-white p-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <Field label="نوع التمويل">
              <select className="input" value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
                {types.map((t) => (
                  <option key={t.financeType} value={t.financeType}>
                    {t.label || t.financeType}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="نوع الراتب">
              <select className="input" value={salaryType} onChange={(e) => setSalaryType(e.target.value)}>
                {SALARY_TYPES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="راتب العميل / الدخل">
              <input className="input" value={salary} onChange={(e) => setSalary(e.target.value)} />
            </Field>
            <Field label="القروض والالتزامات الأخرى">
              <input className="input" value={otherDebts} onChange={(e) => setOtherDebts(e.target.value)} />
            </Field>
            <Field label="قيمة السلعة / الخدمة">
              <input className="input" value={itemPrice} onChange={(e) => setItemPrice(e.target.value)} />
            </Field>
            <Field label="الدفعة الأولى">
              <input className="input" value={downPayment} onChange={(e) => setDownPayment(e.target.value)} />
            </Field>
            <Field label="عدد السنوات">
              <input className="input" value={years} onChange={(e) => setYears(e.target.value)} />
            </Field>
            <Field label="النسبة %">
              <input className="input" value={rate} onChange={(e) => setRate(e.target.value)} />
              {rateAuto != null ? <p className="mt-1 text-xs text-slate-500">تم جلبها تلقائيًا: {rateAuto}% {rateRangeHint ? `(مدى ${rateRangeHint})` : ""}</p> : null}
            </Field>
          </div>

          <button type="button" onClick={clearAll} className="mt-3 rounded-xl bg-slate-200 px-4 py-2 text-sm">
            مسح كامل البيانات
          </button>

          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <Metric title="قيمة التمويل" value={financeAmount} />
            <Metric title="نسبة المرابحة كامل الفترة %" value={fullPeriodRatePct} />
            <Metric title="إجمالي المرابحة" value={totalProfit} />
            <Metric title="إجمالي التمويل مع المرابحة" value={totalWithProfit} featured />
            <Metric title="تأمين تبادلي" value={insurance} />
            <Metric title="مربح البنك الإسلامي" value={bankProfit} />
            <Metric title="القسط الشهري / مع تأمين تبادلي" value={monthlyWithInsurance} />
            <DecisionMetric title="نسبة الالتزام (مع التأمين)" ratio={ratioWith} status={statusWith} />
            <Metric title="القسط الشهري / بدون تأمين تبادلي" value={monthlyWithoutInsurance} />
            <DecisionMetric title="نسبة الالتزام (بدون التأمين)" ratio={ratioWithout} status={statusWithout} />
            <Metric title="مجموع التمويل مع التأمين والربح" value={sumWith} />
            <Metric title="مجموع التمويل بدون التأمين والربح" value={sumWithout} />
          </div>
        </div>

        <div className="space-y-3">
          <SummaryCard label="القسط الشهري (مع التأمين)" value={monthlyWithInsurance} status={statusWith} />
          <SummaryCard label="القسط الشهري (بدون التأمين)" value={monthlyWithoutInsurance} status={statusWithout} />
          <SummaryCard label="إجمالي الربح" value={totalProfit} />
          <SummaryCard label="إجمالي التمويل النهائي" value={sumWith} />
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-[#E60000]/20 bg-white p-5">
        <h3 className="mb-3 text-lg font-semibold text-[#E60000]">مرفقات نوع التمويل المختار</h3>
        {selectedTypeMedia?.imagePath || selectedTypeMedia?.imageUrl ? (
          <div className="mb-4 flex flex-col items-center justify-center gap-2 rounded-2xl border border-[#E60000]/15 bg-[#fff5f5] p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#E60000]">
              <ImageIcon className="h-4 w-4" />
              صورة مرفقة لهذا التمويل
            </div>
            <img
              src={selectedTypeMedia.imagePath ?? selectedTypeMedia.imageUrl ?? ""}
              alt=""
              onClick={() => setPreviewImage(selectedTypeMedia.imagePath ?? selectedTypeMedia.imageUrl ?? null)}
              className="max-h-56 cursor-zoom-in rounded-xl border object-contain"
            />
          </div>
        ) : null}
        {pdfBlobUrl ? (
          <div className="flex justify-center">
            <a
              href={pdfBlobUrl}
              target="_blank"
              rel="noreferrer"
              download="finance-details.pdf"
              className="inline-flex items-center gap-2 rounded-full bg-[#E60000] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#c50000]"
            >
              <FileText className="h-4 w-4" />
              تحميل الشروط والأحكام (PDF)
              <Download className="h-4 w-4" />
            </a>
          </div>
        ) : (
          <p className="text-center text-sm text-slate-500">لا يوجد PDF مرفق لهذا النوع.</p>
        )}
      </div>

      {isAdmin ? <FinanceAdminPanel types={types} rates={rates} onReload={loadAll} /> : null}

      {previewImage ? (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4">
          <div className="relative max-h-[90vh] w-full max-w-4xl rounded-2xl bg-white p-4">
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute right-3 top-3 rounded-full bg-black/60 p-1.5 text-white hover:bg-black"
            >
              <X className="h-4 w-4" />
            </button>
            <img src={previewImage} alt="" className="max-h-[80vh] w-full rounded-xl object-contain" />
          </div>
        </div>
      ) : null}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="text-sm text-slate-700">
      {label}
      <div className="mt-1">{children}</div>
    </label>
  );
}

function Metric({ title, value, featured = false }: { title: string; value: number; featured?: boolean }) {
  const valid = Number.isFinite(value);
  return (
    <div
      className={`rounded-xl border bg-white p-2 ${featured ? "border-[#E60000]/40 bg-[#fff5f5] shadow-sm" : "border-[#E60000]/15"}`}
    >
      <p className={`text-xs ${featured ? "font-semibold text-[#E60000]" : "text-slate-500"}`}>{title}</p>
      <p className={`${featured ? "text-xl font-extrabold text-[#E60000]" : "font-bold text-slate-800"}`}>{valid ? value.toFixed(2) : "—"}</p>
    </div>
  );
}

function DecisionMetric({ title, ratio, status }: { title: string; ratio: number; status: "ACCEPT" | "REJECT" }) {
  return (
    <div className="rounded-xl border border-[#E60000]/15 bg-white p-2">
      <p className="text-xs text-slate-500">{title}</p>
      <p className="flex items-center gap-2 font-semibold">
        <span>{(ratio * 100).toFixed(2)}%</span>
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
            status === "ACCEPT" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
          }`}
        >
          {status}
        </span>
      </p>
    </div>
  );
}

function SummaryCard({ label, value, status }: { label: string; value: number; status?: "ACCEPT" | "REJECT" }) {
  return (
    <div className="rounded-2xl border border-[#E60000]/20 bg-white p-4">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="text-3xl font-extrabold tracking-tight text-[#E60000]">{Number.isFinite(value) ? value.toFixed(2) : "—"}</p>
      {status ? (
        <p className="mt-1">
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
              status === "ACCEPT" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
            }`}
          >
            {status}
          </span>
        </p>
      ) : null}
    </div>
  );
}

function FinanceAdminPanel({
  types,
  rates,
  onReload,
}: {
  types: FinanceType[];
  rates: FinanceRate[];
  onReload: () => Promise<void>;
}) {
  const [newType, setNewType] = useState<FinanceType>({ financeType: "", label: "", imagePath: "", pdfPath: "" });
  const [newRanges, setNewRanges] = useState<RangeDraft[]>([
    { key: `new-${Date.now()}`, salaryType: SALARY_TYPES[0], startYear: "1", endYear: "4", rate: "" },
  ]);
  const [editOpen, setEditOpen] = useState(false);
  const [editingKey, setEditingKey] = useState("");
  const [editType, setEditType] = useState<FinanceType>({ financeType: "", label: "", imagePath: "", pdfPath: "" });
  const [editRanges, setEditRanges] = useState<RangeDraft[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const openEdit = (type: FinanceType) => {
    setEditingKey(type.financeType);
    setEditType({ ...type });
    const related = rates
      .filter((r) => r.financeType === type.financeType)
      .map((r) => ({
        key: r.id,
        salaryType: r.salaryType,
        startYear: String(r.startYear),
        endYear: String(r.endYear),
        rate: String(r.rate),
      }));
    setEditRanges(related.length ? related : [{ key: `new-${Date.now()}`, salaryType: SALARY_TYPES[0], startYear: "1", endYear: "4", rate: "" }]);
    setEditOpen(true);
  };

  const uploadAndSet = async (file: File, setter: (url: string) => void) => {
    setIsUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        alert(data?.error ?? "فشل رفع الملف");
        return;
      }
      setter(String(data.path ?? ""));
    } finally {
      setIsUploading(false);
    }
  };

  const createNewType = async () => {
    if (!newType.financeType.trim()) return;
    setIsCreating(true);
    try {
      await fetch("/api/admin/finance-type-bundle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          financeType: newType.financeType.trim(),
          label: newType.label?.trim() || newType.financeType.trim(),
          imagePath: newType.imagePath ?? null,
          pdfPath: newType.pdfPath ?? null,
          ranges: newRanges.map((r) => ({
            salaryType: r.salaryType,
            startYear: Number(r.startYear || 0),
            endYear: Number(r.endYear || 0),
            rate: Number(r.rate || 0),
          })),
        }),
      });
      setNewType({ financeType: "", label: "", imagePath: "", pdfPath: "" });
      setNewRanges([{ key: `new-${Date.now()}`, salaryType: SALARY_TYPES[0], startYear: "1", endYear: "4", rate: "" }]);
      await onReload();
    } finally {
      setIsCreating(false);
    }
  };

  const saveEdit = async () => {
    const targetFinanceType = editType.financeType.trim();
    if (!targetFinanceType) return;

    setIsSavingEdit(true);
    try {
      await fetch("/api/admin/finance-type-bundle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oldFinanceType: editingKey,
          financeType: targetFinanceType,
          label: editType.label?.trim() || targetFinanceType,
          imagePath: editType.imagePath ?? null,
          pdfPath: editType.pdfPath ?? null,
          ranges: editRanges.map((row) => ({
            salaryType: row.salaryType,
            startYear: Number(row.startYear || 0),
            endYear: Number(row.endYear || 0),
            rate: Number(row.rate || 0),
          })),
        }),
      });
      setEditOpen(false);
      await onReload();
    } finally {
      setIsSavingEdit(false);
    }
  };

  return (
    <div className="mt-6 space-y-4 rounded-2xl border border-dashed border-[#E60000]/35 p-4">
      <h3 className="font-semibold text-[#E60000]">إضافة تمويل جديد</h3>

      <div className="grid gap-2 md:grid-cols-2">
        <input className="input" placeholder="اسم التمويل (المفتاح)" value={newType.financeType ?? ""} onChange={(e) => setNewType((s) => ({ ...s, financeType: e.target.value }))} />
        <input className="input" placeholder="الاسم الظاهر للموظف" value={newType.label ?? ""} onChange={(e) => setNewType((s) => ({ ...s, label: e.target.value }))} />
        <input
          type="file"
          accept="image/*"
          className="text-sm"
          disabled={isUploading || isCreating}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            await uploadAndSet(file, (url) => setNewType((s) => ({ ...s, imagePath: url })));
          }}
        />
        <input
          type="file"
          accept=".pdf"
          className="text-sm"
          disabled={isUploading || isCreating}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            await uploadAndSet(file, (url) => setNewType((s) => ({ ...s, pdfPath: url })));
          }}
        />
      </div>

      <div className="space-y-2 rounded-xl border border-[#E60000]/15 p-3">
        <p className="font-semibold text-[#E60000]">نطاقات النسب لهذا التمويل الجديد</p>
        {newRanges.map((row) => (
          <div key={row.key} className="grid gap-2 md:grid-cols-5">
            <select className="input" value={row.salaryType} onChange={(e) => setNewRanges((prev) => prev.map((x) => (x.key === row.key ? { ...x, salaryType: e.target.value } : x)))}>
              {SALARY_TYPES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <input className="input" placeholder="من سنة" value={row.startYear} onChange={(e) => setNewRanges((prev) => prev.map((x) => (x.key === row.key ? { ...x, startYear: e.target.value } : x)))} />
            <input className="input" placeholder="إلى سنة" value={row.endYear} onChange={(e) => setNewRanges((prev) => prev.map((x) => (x.key === row.key ? { ...x, endYear: e.target.value } : x)))} />
            <input className="input" placeholder="النسبة %" value={row.rate} onChange={(e) => setNewRanges((prev) => prev.map((x) => (x.key === row.key ? { ...x, rate: e.target.value } : x)))} />
            <button type="button" className="rounded-lg bg-red-100 px-2 py-1 text-red-700" onClick={() => setNewRanges((prev) => prev.filter((x) => x.key !== row.key))}>
              حذف
            </button>
          </div>
        ))}
        <button
          type="button"
          className="rounded-lg bg-slate-100 px-3 py-2 text-slate-800"
          onClick={() =>
            setNewRanges((prev) => [
              ...prev,
              { key: `new-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, salaryType: SALARY_TYPES[0], startYear: "", endYear: "", rate: "" },
            ])
          }
        >
          أضف نطاق نسبة
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-xl bg-[#E60000] px-3 py-2 text-white"
          disabled={isUploading || isCreating}
          onClick={createNewType}
        >
          {isCreating ? "جاري الحفظ..." : isUploading ? "جاري الرفع..." : "إضافة تمويل"}
        </button>
      </div>

      <div className="max-h-72 overflow-auto rounded-xl border border-[#E60000]/15">
        <table className="w-full text-xs">
          <thead className="bg-[#E60000]/10">
            <tr>
              <th className="p-2 text-right">التمويل</th>
              <th className="p-2 text-right">الاسم الظاهر</th>
              <th className="p-2 text-right">عدد نطاقات النسب</th>
              <th className="p-2 text-right">إجراء</th>
            </tr>
          </thead>
          <tbody>
            {types.map((t) => (
              <tr key={t.financeType} className="border-t border-[#E60000]/10">
                <td className="p-2">{t.financeType}</td>
                <td className="p-2">{t.label || "—"}</td>
                <td className="p-2">{rates.filter((r) => r.financeType === t.financeType).length}</td>
                <td className="p-2">
                  <div className="flex gap-2">
                    <button type="button" className="rounded-lg bg-slate-100 px-2 py-1 text-slate-800" onClick={() => openEdit(t)}>
                      تعديل
                    </button>
                    <button
                      type="button"
                      className="rounded-lg bg-red-100 px-2 py-1 text-red-700"
                      onClick={async () => {
                        await fetch(`/api/admin/finance-type-config?financeType=${encodeURIComponent(t.financeType)}`, { method: "DELETE" });
                        await onReload();
                      }}
                    >
                      حذف
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editOpen ? (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-auto rounded-2xl bg-white p-5 shadow-2xl">
            <h4 className="mb-4 text-lg font-bold text-[#E60000]">تعديل التمويل والنسب بنطاق سنوات</h4>

            <div className="grid gap-2 md:grid-cols-2">
              <input className="input" placeholder="اسم التمويل (المفتاح)" value={editType.financeType ?? ""} onChange={(e) => setEditType((s) => ({ ...s, financeType: e.target.value }))} />
              <input className="input" placeholder="الاسم الظاهر" value={editType.label ?? ""} onChange={(e) => setEditType((s) => ({ ...s, label: e.target.value }))} />
              <input
                type="file"
                accept="image/*"
                className="text-sm"
                disabled={isUploading || isSavingEdit}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  await uploadAndSet(file, (url) => setEditType((s) => ({ ...s, imagePath: url })));
                }}
              />
              <input
                type="file"
                accept=".pdf"
                className="text-sm"
                disabled={isUploading || isSavingEdit}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  await uploadAndSet(file, (url) => setEditType((s) => ({ ...s, pdfPath: url })));
                }}
              />
            </div>

            <div className="mt-4 space-y-2 rounded-xl border border-[#E60000]/15 p-3">
              <p className="font-semibold text-[#E60000]">نطاقات النسب</p>
              {editRanges.map((row) => (
                <div key={row.key} className="grid gap-2 md:grid-cols-5">
                  <select className="input" value={row.salaryType} onChange={(e) => setEditRanges((prev) => prev.map((x) => (x.key === row.key ? { ...x, salaryType: e.target.value } : x)))}>
                    {SALARY_TYPES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <input className="input" placeholder="من سنة" value={row.startYear} onChange={(e) => setEditRanges((prev) => prev.map((x) => (x.key === row.key ? { ...x, startYear: e.target.value } : x)))} />
                  <input className="input" placeholder="إلى سنة" value={row.endYear} onChange={(e) => setEditRanges((prev) => prev.map((x) => (x.key === row.key ? { ...x, endYear: e.target.value } : x)))} />
                  <input className="input" placeholder="النسبة %" value={row.rate} onChange={(e) => setEditRanges((prev) => prev.map((x) => (x.key === row.key ? { ...x, rate: e.target.value } : x)))} />
                  <button
                    type="button"
                    className="rounded-lg bg-red-100 px-2 py-1 text-red-700"
                    onClick={() => setEditRanges((prev) => prev.filter((x) => x.key !== row.key))}
                  >
                    حذف
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="rounded-lg bg-slate-100 px-3 py-2 text-slate-800"
                onClick={() =>
                  setEditRanges((prev) => [
                    ...prev,
                    { key: `new-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, salaryType: SALARY_TYPES[0], startYear: "", endYear: "", rate: "" },
                  ])
                }
              >
                + إضافة نطاق جديد
              </button>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className="rounded-xl bg-slate-200 px-4 py-2" disabled={isSavingEdit} onClick={() => setEditOpen(false)}>
                إلغاء
              </button>
              <button type="button" className="rounded-xl bg-[#E60000] px-4 py-2 text-white" disabled={isUploading || isSavingEdit} onClick={saveEdit}>
                {isSavingEdit ? "جاري الحفظ..." : isUploading ? "جاري الرفع..." : "حفظ التعديلات"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
