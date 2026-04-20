"use client";

import { FINANCE_TYPES, useMurabahaTakafulBase } from "@/lib/finance-types";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const salaryTypes = ["راتب محول", "راتب غير محول", "دخل حر"] as const;
type NewRateForm = {
  financeType: string;
  salaryType: string;
  years: string;
  rate: string;
};

function parseNum(v: string): number | null {
  const t = v.replace(/,/g, "").trim();
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export default function FinanceCalculatorPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const [financeType, setFinanceType] = useState<string>(FINANCE_TYPES[0]);
  const [salaryType, setSalaryType] = useState<string>(salaryTypes[0]);
  const [years, setYears] = useState("3");
  const [income, setIncome] = useState("");
  const [other, setOther] = useState("");
  const [value, setValue] = useState("");
  const [downPayment, setDownPayment] = useState("");
  const [rate, setRate] = useState("");
  const [typeImage, setTypeImage] = useState<string | null>(null);
  const [adminImg, setAdminImg] = useState<{ financeType: string; imageUrl: string }>({
    financeType: FINANCE_TYPES[0],
    imageUrl: "",
  });
  const [rates, setRates] = useState<Array<{ id: string; financeType: string; salaryType: string; years: number; rate: number }>>([]);
  const [newRate, setNewRate] = useState<NewRateForm>({
    financeType: String(FINANCE_TYPES[0] ?? ""),
    salaryType: String(salaryTypes[0] ?? ""),
    years: "3",
    rate: "",
  });

  const murabahaBase = useMurabahaTakafulBase(financeType);

  useEffect(() => {
    fetch("/api/admin/finance-type-config")
      .then((r) => r.json())
      .then((rows: { financeType: string; imageUrl: string | null }[]) => {
        const hit = rows.find((x) => x.financeType === financeType);
        setTypeImage(hit?.imageUrl ?? null);
      })
      .catch(() => setTypeImage(null));
  }, [financeType]);

  useEffect(() => {
    const y = parseNum(years);
    if (y == null || y <= 0) return;
    fetch(
      `/api/finance-rates/lookup?financeType=${encodeURIComponent(financeType)}&salaryType=${encodeURIComponent(
        salaryType
      )}&years=${y}`
    )
      .then((r) => r.json())
      .then((d: { rate: number | null }) => {
        if (d.rate != null) setRate(String(d.rate));
      });
  }, [financeType, salaryType, years]);

  useEffect(() => {
    if (!isAdmin) return;
    fetch("/api/finance-rates")
      .then((r) => r.json())
      .then(setRates)
      .catch(() => setRates([]));
  }, [isAdmin]);

  const calc = useMemo(() => {
    const y = parseNum(years);
    const v = parseNum(value);
    const down = parseNum(downPayment);
    const rPct = parseNum(rate);
    const inc = parseNum(income);
    const oth = parseNum(other) ?? 0;

    const invalid =
      y == null ||
      y <= 0 ||
      v == null ||
      down == null ||
      rPct == null ||
      rPct < 0 ||
      inc == null ||
      inc <= 0;

    if (invalid) {
      return {
        ok: false as const,
        financeValue: null as number | null,
        fullRatePct: null as number | null,
        totalMurabaha: null as number | null,
        totalWithMurabaha: null as number | null,
        takaful: null as number | null,
        bankProfit: null as number | null,
        monthlyWith: null as number | null,
        monthlyWithout: null as number | null,
        ratioWith: null as number | null,
        ratioWithout: null as number | null,
        sumWith: null as number | null,
        sumWithout: null as number | null,
      };
    }

    const r = rPct / 100;
    const financeValue = v - down;
    const fullRate = y * r;
    const totalMurabaha = fullRate * financeValue;
    const totalWithMurabaha = totalMurabaha + financeValue;
    const takaful = 0.005 * y * (murabahaBase ? totalWithMurabaha : financeValue);
    const monthlyWith = (totalWithMurabaha + takaful) / (y * 12);
    const monthlyWithout = totalWithMurabaha / (y * 12);
    const ratioWith = (monthlyWith + oth) / inc;
    const ratioWithout = (monthlyWithout + oth) / inc;
    return {
      ok: true as const,
      financeValue,
      fullRatePct: fullRate * 100,
      totalMurabaha,
      totalWithMurabaha,
      takaful,
      bankProfit: totalWithMurabaha - financeValue,
      monthlyWith,
      monthlyWithout,
      ratioWith,
      ratioWithout,
      sumWith: totalWithMurabaha + takaful,
      sumWithout: totalWithMurabaha,
    };
  }, [years, value, downPayment, rate, murabahaBase, other, income]);

  const chartData = useMemo(() => {
    if (!calc.ok) return [];
    return [
      { name: "قيمة التمويل", v: calc.financeValue ?? 0 },
      { name: "إجمالي المرابحة", v: calc.totalMurabaha ?? 0 },
      { name: "تأمين تبادلي", v: calc.takaful ?? 0 },
      { name: "إجمالي مع المرابحة", v: calc.totalWithMurabaha ?? 0 },
    ];
  }, [calc]);

  const clearAll = () => {
    setIncome("");
    setOther("");
    setValue("");
    setDownPayment("");
    setYears("");
    setRate("");
  };

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="mb-4 text-xl font-bold text-[#9e1b1f]">احتساب معاملة</h2>
      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="text-sm text-slate-600">
              نوع التمويل
              <select
                value={financeType}
                onChange={(e) => setFinanceType(e.target.value)}
                className="input mt-1"
              >
                {FINANCE_TYPES.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm text-slate-600">
              نوع الراتب
              <select
                value={salaryType}
                onChange={(e) => setSalaryType(e.target.value)}
                className="input mt-1"
              >
                {salaryTypes.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </label>
            <input
              className="input"
              placeholder="راتب العميل / الدخل"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
            />
            <input
              className="input"
              placeholder="القروض والالتزامات الأخرى"
              value={other}
              onChange={(e) => setOther(e.target.value)}
            />
            <input
              className="input"
              placeholder="قيمة السلعة / الخدمة"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
            <input
              className="input"
              placeholder="الدفعة الأولى"
              value={downPayment}
              onChange={(e) => setDownPayment(e.target.value)}
            />
            <input
              className="input"
              placeholder="عدد السنوات"
              value={years}
              onChange={(e) => setYears(e.target.value)}
            />
            <div className="flex gap-2">
              <input
                className="input flex-1"
                placeholder="النسبة % (سنوية)"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
              />
            </div>
          </div>
          {typeImage ? (
            <img src={typeImage} alt="" className="mt-4 max-h-56 rounded-lg border object-contain" />
          ) : null}
          <button
            type="button"
            onClick={clearAll}
            className="mt-4 rounded-lg bg-slate-200 px-4 py-2 text-sm hover:bg-slate-300"
          >
            مسح كامل البيانات
          </button>
          {isAdmin ? (
            <div className="mt-4 rounded-lg border border-dashed border-[#9e1b1f]/40 p-3 text-sm">
              <p className="mb-2 font-semibold text-[#9e1b1f]">صورة لنوع تمويل (للمسؤول)</p>
              <select
                className="input mb-2"
                value={adminImg.financeType}
                onChange={(e) => setAdminImg((s) => ({ ...s, financeType: e.target.value }))}
              >
                {FINANCE_TYPES.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
              <input
                className="mb-2 text-sm"
                type="file"
                accept="image/*"
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
                  setAdminImg((s) => ({ ...s, imageUrl: data.url }));
                }}
              />
              {adminImg.imageUrl ? <p className="mb-2 text-xs text-slate-500">{adminImg.imageUrl}</p> : null}
              <button
                type="button"
                className="rounded-lg bg-[#9e1b1f] px-3 py-1 text-white"
                onClick={async () => {
                  await fetch("/api/admin/finance-type-config", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(adminImg),
                  });
                  alert("تم الحفظ.");
                  if (adminImg.financeType === financeType) setTypeImage(adminImg.imageUrl || null);
                }}
              >
                حفظ الصورة لهذا النوع
              </button>
            </div>
          ) : null}
        </div>

        <div>
          <h3 className="mb-2 text-sm font-semibold text-[#ef7d00]">النتائج</h3>
          <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            <Result label="قيمة التمويل" value={calc.financeValue} />
            <Result label="نسبة المرابحة عن كامل الفترة" value={calc.fullRatePct} suffix="%" />
            <Result label="إجمالي المرابحة" value={calc.totalMurabaha} />
            <Result label="إجمالي التمويل مع المرابحة" value={calc.totalWithMurabaha} />
            <Result label="تأمين تبادلي" value={calc.takaful} />
            <Result label="مربح البنك الإسلامي" value={calc.bankProfit} />
            <Result label="القسط الشهري / مع تأمين تبادلي" value={calc.monthlyWith} />
            <RatioRow
              label="نسبة الالتزام (مع التأمين)"
              ratio={calc.ratioWith}
            />
            <Result label="القسط الشهري / بدون تأمين تبادلي" value={calc.monthlyWithout} />
            <RatioRow
              label="نسبة الالتزام (بدون التأمين)"
              ratio={calc.ratioWithout}
            />
            <Result label="مجموع التمويل مع التأمين والربح" value={calc.sumWith} />
            <Result label="مجموع التمويل بدون التأمين والربح" value={calc.sumWithout} />
          </div>
          <div className="mt-4 h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v) => (typeof v === "number" ? v.toFixed(2) : String(v ?? ""))} />
                <Bar dataKey="v" fill="#9e1b1f" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      {isAdmin ? (
        <div className="mt-6 rounded-xl border border-[#ef7d00]/30 bg-white/70 p-4">
          <h3 className="mb-3 font-semibold text-[#9e1b1f]">جدول نسب التمويل (إضافة/تعديل)</h3>
          <div className="mb-3 grid gap-2 md:grid-cols-5">
            <select className="input" value={newRate.financeType} onChange={(e) => setNewRate((s) => ({ ...s, financeType: e.target.value }))}>
              {FINANCE_TYPES.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
            <select className="input" value={newRate.salaryType} onChange={(e) => setNewRate((s) => ({ ...s, salaryType: e.target.value }))}>
              {salaryTypes.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
            <input className="input" value={newRate.years} onChange={(e) => setNewRate((s) => ({ ...s, years: e.target.value }))} placeholder="السنوات" />
            <input className="input" value={newRate.rate} onChange={(e) => setNewRate((s) => ({ ...s, rate: e.target.value }))} placeholder="النسبة %" />
            <button
              type="button"
              className="rounded-lg bg-[#9e1b1f] px-3 py-2 text-white"
              onClick={async () => {
                await fetch("/api/finance-rates", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    financeType: newRate.financeType,
                    salaryType: newRate.salaryType,
                    years: Number(newRate.years || 0),
                    rate: Number(newRate.rate || 0),
                  }),
                });
                const res = await fetch("/api/finance-rates");
                setRates(await res.json());
              }}
            >
              حفظ النسبة
            </button>
          </div>
          <div className="max-h-64 overflow-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b">
                  <th className="p-2 text-right">نوع التمويل</th>
                  <th className="p-2 text-right">نوع الراتب</th>
                  <th className="p-2 text-right">السنوات</th>
                  <th className="p-2 text-right">النسبة</th>
                  <th className="p-2 text-right">إجراء</th>
                </tr>
              </thead>
              <tbody>
                {rates.map((r) => (
                  <tr key={r.id} className="border-b">
                    <td className="p-2">{r.financeType}</td>
                    <td className="p-2">{r.salaryType}</td>
                    <td className="p-2">{r.years}</td>
                    <td className="p-2">{r.rate}</td>
                    <td className="p-2">
                      <button
                        type="button"
                        className="text-red-600"
                        onClick={async () => {
                          await fetch(`/api/finance-rates/${r.id}`, { method: "DELETE" });
                          setRates((list) => list.filter((x) => x.id !== r.id));
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
      ) : null}
    </section>
  );
}

function Result({
  label,
  value,
  suffix = "",
}: {
  label: string;
  value: number | null;
  suffix?: string;
}) {
  const valid = value != null && Number.isFinite(value);
  return (
    <div className="rounded-lg border border-slate-200 bg-[#f8fafc] p-2">
      <p className="text-slate-500">{label}</p>
      <p className="font-semibold">
        {valid ? (
          <>
            {value!.toFixed(2)} {suffix}
          </>
        ) : (
          <span className="text-amber-700">تنبيه: أدخل أرقامًا صحيحة في الحقول المطلوبة</span>
        )}
      </p>
    </div>
  );
}

function RatioRow({ label, ratio }: { label: string; ratio: number | null }) {
  const valid = ratio != null && Number.isFinite(ratio);
  const pct = valid ? ratio! * 100 : null;
  const decision = valid ? (ratio! <= 0.5 ? "accept" : "reject") : null;
  return (
    <div className="rounded-lg border border-slate-200 bg-[#f8fafc] p-2 sm:col-span-2">
      <p className="text-slate-500">{label}</p>
      <p className="font-semibold">
        {valid ? (
          <>
            {pct!.toFixed(2)}% — {decision}
          </>
        ) : (
          <span className="text-amber-700">تنبيه: لا يمكن الاحتساب</span>
        )}
      </p>
    </div>
  );
}
