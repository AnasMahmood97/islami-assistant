"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Download, FileText, ImageIcon } from "lucide-react";

type FinanceType = { financeType: string; label?: string | null; imageUrl?: string | null; pdfUrl?: string | null };
type FinanceRate = { id: string; financeType: string; salaryType: string; years: number; rate: number };
type NumericField = { raw: string; value: number | null; hasLetters: boolean };
type RateForm = { financeType: string; salaryType: string; years: string; rate: string };

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
      ...keysFromRates.filter((k) => !keySet.has(k)).map((k) => ({ financeType: k, label: k, imageUrl: null, pdfUrl: null })),
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
        if (next != null) setRate(String(next));
      })
      .catch(() => setRateAuto(null));
  }, [selectedType, salaryType, years]);

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
              {rateAuto != null ? <p className="mt-1 text-xs text-slate-500">تم جلبها تلقائيًا: {rateAuto}%</p> : null}
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
        {selectedTypeMedia?.imageUrl ? (
          <div className="mb-4 flex flex-col items-center justify-center gap-2 rounded-2xl border border-[#E60000]/15 bg-[#fff5f5] p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#E60000]">
              <ImageIcon className="h-4 w-4" />
              صورة مرفقة لهذا التمويل
            </div>
            <img src={selectedTypeMedia.imageUrl} alt="" className="max-h-56 rounded-xl border object-contain" />
          </div>
        ) : null}
        {selectedTypeMedia?.pdfUrl ? (
          <div className="flex justify-center">
            <a
              href={selectedTypeMedia.pdfUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[#E60000] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#c50000]"
            >
              <FileText className="h-4 w-4" />
              تحميل ملف PDF
              <Download className="h-4 w-4" />
            </a>
          </div>
        ) : (
          <p className="text-center text-sm text-slate-500">لا يوجد PDF مرفق لهذا النوع.</p>
        )}
      </div>

      {isAdmin ? <FinanceAdminPanel types={types} rates={rates} onReload={loadAll} /> : null}
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
  const [draftType, setDraftType] = useState<FinanceType>({ financeType: "", label: "", imageUrl: "", pdfUrl: "" });
  const [rateForm, setRateForm] = useState<RateForm>({ financeType: "", salaryType: SALARY_TYPES[0], years: "", rate: "" });

  return (
    <div className="mt-6 space-y-4 rounded-2xl border border-dashed border-[#E60000]/35 p-4">
      <h3 className="font-semibold text-[#E60000]">إدارة أنواع التمويل والنسب</h3>

      <div className="grid gap-2 md:grid-cols-2">
        <input className="input" placeholder="اسم التمويل (المفتاح)" value={draftType.financeType ?? ""} onChange={(e) => setDraftType((s) => ({ ...s, financeType: e.target.value }))} />
        <input className="input" placeholder="الاسم الظاهر للموظف" value={draftType.label ?? ""} onChange={(e) => setDraftType((s) => ({ ...s, label: e.target.value }))} />
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
            const data = await res.json();
            if (res.ok) setDraftType((s) => ({ ...s, imageUrl: data.url }));
          }}
        />
        <input
          type="file"
          accept=".pdf"
          className="text-sm"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const fd = new FormData();
            fd.append("file", file);
            const res = await fetch("/api/uploads", { method: "POST", body: fd });
            const data = await res.json();
            if (res.ok) setDraftType((s) => ({ ...s, pdfUrl: data.url }));
          }}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-xl bg-[#E60000] px-3 py-2 text-white"
          onClick={async () => {
            await fetch("/api/admin/finance-type-config", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(draftType),
            });
            await onReload();
            alert("تم حفظ نوع التمويل.");
          }}
        >
          حفظ/تحديث النوع
        </button>
        <button
          type="button"
          className="rounded-xl bg-red-700 px-3 py-2 text-white"
          onClick={async () => {
            if (!draftType.financeType) return;
            await fetch(`/api/admin/finance-type-config?financeType=${encodeURIComponent(draftType.financeType)}`, { method: "DELETE" });
            await onReload();
          }}
        >
          حذف النوع
        </button>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const file = fd.get("file");
            if (!(file instanceof File) || file.size === 0) return;
            const res = await fetch("/api/admin/import/finance-rates", { method: "POST", body: fd });
            const data = await res.json();
            alert(`تم استيراد ${data.imported ?? 0} صف من ملف النسب`);
            await onReload();
          }}
          className="flex items-center gap-2"
        >
          <input name="file" type="file" accept=".xlsx,.xls" className="text-sm" />
          <button className="rounded-xl bg-slate-700 px-3 py-2 text-white" type="submit">
            استيراد نسب Excel
          </button>
        </form>
      </div>

      <div className="grid gap-2 md:grid-cols-4">
        <select className="input" value={rateForm.financeType} onChange={(e) => setRateForm((s) => ({ ...s, financeType: e.target.value }))}>
          <option value="">اختر نوع التمويل</option>
          {types.map((t) => <option key={t.financeType} value={t.financeType}>{t.label || t.financeType}</option>)}
        </select>
        <select className="input" value={rateForm.salaryType} onChange={(e) => setRateForm((s) => ({ ...s, salaryType: e.target.value }))}>
          {SALARY_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <input className="input" placeholder="السنوات" value={rateForm.years} onChange={(e) => setRateForm((s) => ({ ...s, years: e.target.value }))} />
        <input className="input" placeholder="النسبة %" value={rateForm.rate} onChange={(e) => setRateForm((s) => ({ ...s, rate: e.target.value }))} />
      </div>
      <button
        type="button"
        className="rounded-xl bg-[#E60000] px-3 py-2 text-white"
        onClick={async () => {
          await fetch("/api/finance-rates", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              financeType: rateForm.financeType,
              salaryType: rateForm.salaryType,
              years: Number(rateForm.years || 0),
              rate: Number(rateForm.rate || 0),
            }),
          });
          await onReload();
        }}
      >
        حفظ/تحديث نسبة
      </button>

      <div className="max-h-72 overflow-auto rounded-xl border border-[#E60000]/15">
        <table className="w-full text-xs">
          <thead className="bg-[#E60000]/10">
            <tr>
              <th className="p-2 text-right">التمويل</th>
              <th className="p-2 text-right">الراتب</th>
              <th className="p-2 text-right">السنوات</th>
              <th className="p-2 text-right">النسبة</th>
              <th className="p-2 text-right">إجراء</th>
            </tr>
          </thead>
          <tbody>
            {rates.map((r) => (
              <tr key={r.id} className="border-t border-[#E60000]/10">
                <td className="p-2">{r.financeType}</td>
                <td className="p-2">{r.salaryType}</td>
                <td className="p-2">{r.years}</td>
                <td className="p-2">{r.rate}</td>
                <td className="p-2">
                  <button
                    type="button"
                    className="text-red-700"
                    onClick={async () => {
                      await fetch(`/api/finance-rates/${r.id}`, { method: "DELETE" });
                      await onReload();
                    }}
                  >
                    حذف
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
