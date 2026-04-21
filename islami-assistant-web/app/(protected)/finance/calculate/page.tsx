"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

type FinanceType = { financeType: string; label?: string | null; imageUrl?: string | null; pdfUrl?: string | null };

function n(v: string) {
  const x = Number(v || 0);
  return Number.isFinite(x) ? x : 0;
}

export default function FinanceCalculatorPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const [types, setTypes] = useState<FinanceType[]>([]);
  const [selected, setSelected] = useState("");
  const [salary, setSalary] = useState("نوع الراتب");
  const [years, setYears] = useState("5");
  const [amount, setAmount] = useState("10000");
  const [down, setDown] = useState("0");
  const [rate, setRate] = useState("10");
  const [income, setIncome] = useState("1200");

  const load = async () => {
    const cfg = await fetch("/api/admin/finance-type-config").then((r) => r.json());
    let rows = Array.isArray(cfg) ? cfg : [];
    if (rows.length === 0) {
      const rates = await fetch("/api/finance-rates").then((r) => r.json()).catch(() => []);
      const keys = [...new Set((Array.isArray(rates) ? rates : []).map((r: { financeType?: string }) => r.financeType).filter(Boolean))];
      rows = keys.map((financeType) => ({ financeType, label: financeType, imageUrl: null, pdfUrl: null }));
    }
    setTypes(rows);
    if (!selected && rows[0]?.financeType) setSelected(rows[0].financeType);
  };

  useEffect(() => {
    fetch("/api/admin/finance-type-config")
      .then((r) => r.json())
      .then(async (cfg) => {
        let rows = Array.isArray(cfg) ? cfg : [];
        if (rows.length === 0) {
          const rates = await fetch("/api/finance-rates").then((r) => r.json()).catch(() => []);
          const keys = [...new Set((Array.isArray(rates) ? rates : []).map((r: { financeType?: string }) => r.financeType).filter(Boolean))];
          rows = keys.map((financeType) => ({ financeType, label: financeType, imageUrl: null, pdfUrl: null }));
        }
        setTypes(rows);
        if (!selected && rows[0]?.financeType) setSelected(rows[0].financeType);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const current = types.find((x) => x.financeType === selected) ?? null;
  const financed = Math.max(n(amount) - n(down), 0);
  const profit = financed * (n(rate) / 100) * n(years);
  const total = financed + profit;
  const monthly = n(years) > 0 ? total / (n(years) * 12) : 0;
  const ratio = n(income) > 0 ? (monthly / n(income)) * 100 : 0;

  return (
    <section className="chat-pane">
      <h2 className="mb-4 text-3xl font-bold text-[#9e1b1f]">احتساب معاملة</h2>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3 rounded-2xl border border-[#9e1b1f]/20 bg-white p-4">
          <label className="text-sm">نوع التمويل</label>
          <select className="input" value={selected} onChange={(e) => setSelected(e.target.value)}>
            {types.map((t) => <option key={t.financeType} value={t.financeType}>{t.label || t.financeType}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <input className="input" value={salary} onChange={(e) => setSalary(e.target.value)} placeholder="نوع الراتب" />
            <input className="input" value={years} onChange={(e) => setYears(e.target.value)} placeholder="عدد السنوات" />
            <input className="input" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="أصل التمويل" />
            <input className="input" value={down} onChange={(e) => setDown(e.target.value)} placeholder="الدفعة الأولى" />
            <input className="input" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="نسبة المرابحة %" />
            <input className="input" value={income} onChange={(e) => setIncome(e.target.value)} placeholder="دخل العميل" />
          </div>
          {current?.imageUrl ? <img src={current.imageUrl} alt="" className="max-h-52 rounded-xl border object-contain" /> : null}
          {current?.pdfUrl ? <a href={current.pdfUrl} target="_blank" rel="noreferrer" className="inline-block rounded-xl bg-[#9e1b1f] px-3 py-2 text-sm text-white">عرض ملف PDF</a> : null}
        </div>

        <div className="space-y-3 rounded-2xl border border-[#9e1b1f]/20 bg-white p-4">
          <Result label="القسط الشهري التقريبي" value={`${monthly.toFixed(2)} JOD`} big />
          <div className="grid grid-cols-2 gap-2">
            <Result label="إجمالي المرابحة" value={profit.toFixed(2)} />
            <Result label="إجمالي المبلغ" value={total.toFixed(2)} />
            <Result label="أصل التمويل" value={financed.toFixed(2)} />
            <Result label="نسبة الالتزام" value={`${ratio.toFixed(2)}%`} />
          </div>
        </div>
      </div>

      {isAdmin ? <FinanceAdminPanel types={types} onReload={load} /> : null}
    </section>
  );
}

function Result({ label, value, big = false }: { label: string; value: string; big?: boolean }) {
  return (
    <div className={`rounded-2xl border border-[#9e1b1f]/20 bg-white p-3 text-center ${big ? "py-5" : ""}`}>
      <p className="text-sm text-slate-600">{label}</p>
      <p className={`${big ? "text-4xl" : "text-2xl"} font-bold text-[#9e1b1f]`}>{value}</p>
    </div>
  );
}

function FinanceAdminPanel({ types, onReload }: { types: FinanceType[]; onReload: () => Promise<void> }) {
  const [selectedType, setSelectedType] = useState("");
  const [draft, setDraft] = useState<FinanceType>({ financeType: "", label: "", imageUrl: "", pdfUrl: "" });
  const activeType = selectedType || types[0]?.financeType || "";

  return (
    <div className="mt-6 rounded-2xl border border-dashed border-[#9e1b1f]/35 p-4">
      <h3 className="mb-3 font-semibold text-[#9e1b1f]">إدارة أنواع التمويلات (اسم + صورة + PDF)</h3>
      <div className="grid gap-2 md:grid-cols-2">
        <select
          className="input"
          value={activeType}
          onChange={(e) => {
            const key = e.target.value;
            setSelectedType(key);
            const hit = types.find((t) => t.financeType === key);
            if (hit) setDraft(hit);
          }}
        >
          {types.map((t) => <option key={t.financeType} value={t.financeType}>{t.label || t.financeType}</option>)}
        </select>
        <input className="input" value={draft.label ?? ""} onChange={(e) => setDraft((s) => ({ ...s, label: e.target.value }))} placeholder="اسم التمويل الظاهر للموظف" />
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
            if (res.ok) setDraft((s) => ({ ...s, imageUrl: data.url }));
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
            if (res.ok) setDraft((s) => ({ ...s, pdfUrl: data.url }));
          }}
        />
      </div>
      <button
        type="button"
        className="mt-3 rounded-xl bg-[#9e1b1f] px-4 py-2 text-white"
        onClick={async () => {
          const payload = { ...draft, financeType: draft.financeType || activeType, label: draft.label || activeType };
          await fetch("/api/admin/finance-type-config", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          await onReload();
          alert("تم حفظ بيانات نوع التمويل.");
        }}
      >
        حفظ
      </button>
    </div>
  );
}
