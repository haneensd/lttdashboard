"use client";
import { useMemo, useState } from "react";
import { CUSTOMERS, REGIONS, PLANS, AGE_BANDS, DEFAULT_FILTERS, Filters, applyFilters, groupRate, fmtNum, riskColorHex, Customer } from "@/lib/data";
import { BarHChart, ScatterChart } from "./charts";

const SEGMENT_DEFS = [
  { title: "فاتورة مرتفعة ومخاطرة عالية", reasonKey: "ارتفاع الفاتورة", color: "critical",
    icon: <><path d="M12 2v20" /><path d="M17 5.5c0-1.9-2.2-3.5-5-3.5s-5 1.6-5 3.5 2.2 3.2 5 3.5c2.8.3 5 1.6 5 3.5s-2.2 3.5-5 3.5-5-1.6-5-3.5" /></>,
    desc: "عملاء يدفعون أعلى من متوسط باقتهم بوضوح مع احتمالية مغادرة مرتفعة أو متوسطة.", action: "عرض خصم مؤقت أو تعديل الباقة" },
  { title: "عقود قريبة من الانتهاء", reasonKey: "انتهاء العقد", color: "warning",
    icon: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></>,
    desc: "عقود سنوية أو شهرية ستنتهي خلال ٤٥ يوماً لدى عملاء معرضين للمغادرة.", action: "التجديد المبكر بعرض تفضيلي" },
  { title: "شكاوى ومكالمات دعم متكررة", reasonKey: "كثرة الشكاوى", color: "critical",
    icon: <path d="M21 11.5a8.5 8.5 0 0 1-12.4 7.5L3 20l1-5.4A8.5 8.5 0 1 1 21 11.5Z" />,
    desc: "تجارب دعم متكررة دون حل واضح، مع تراجع في درجة الرضا.", action: "مكالمة استباقية من فريق الدعم" },
  { title: "تفاعل مع عروض المنافسين", reasonKey: "عروض المنافسين", color: "warning",
    icon: <><path d="M12 2 2 7l10 5 10-5-10-5Z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></>,
    desc: "عملاء رصدت لديهم إشارات اهتمام بعروض منافسة في السوق.", action: "عرض احتفاظ مخصص بأسعار تنافسية" },
  { title: "عملاء أوفياء منخفضو المخاطرة", reasonKey: null, tenureMin: 36, riskWant: "منخفض", color: "good",
    icon: <path d="m12 21-1.5-1.4C5 15 2 12.3 2 8.8 2 6 4.2 3.8 7 3.8c1.6 0 3.1.8 4 2 .9-1.2 2.4-2 4-2 2.8 0 5 2.2 5 5 0 3.5-3 6.2-8.5 10.8L12 21Z" />,
    desc: "قاعدة عملاء مستقرة منذ أكثر من ٣ سنوات بمؤشرات رضا جيدة — فرصة للترقية.", action: "عرض ترقية باقة أو مكافأة ولاء" },
] as const;

export default function AnalysisView() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);

  const list = useMemo(() => applyFilters(CUSTOMERS, filters), [filters]);

  const planAgg = useMemo(() => groupRate(list, (c) => c.plan_type).sort((a, b) => b.rate - a.rate), [list]);
  const scatterPoints = useMemo(() => {
    const sampled = list.length > 500 ? list.filter((_, i) => i % Math.ceil(list.length / 500) === 0) : list;
    return sampled.map((c) => ({ x: c.satisfaction_score, y: c.monthly_bill, name: c.customer_name, risk: c.risk_level, color: riskColorHex(c.risk_level) }));
  }, [list]);
  const yMax = useMemo(() => Math.max(...CUSTOMERS.map((c) => c.monthly_bill)) * 1.05, []);

  const reasonItems = useMemo(() => {
    const atRisk = list.filter((c) => c.risk_level !== "منخفض" && c.churn_reason);
    const m = new Map<string, number>();
    atRisk.forEach((c) => m.set(c.churn_reason as string, (m.get(c.churn_reason as string) || 0) + 1));
    return [...m.entries()].map(([label, n]) => ({ label, value: n })).sort((a, b) => b.value - a.value);
  }, [list]);

  const summary = useMemo(() => {
    const highN = list.filter((c) => c.risk_level === "مرتفع").length;
    const medN = list.filter((c) => c.risk_level === "متوسط").length;
    const avgProb = list.length ? list.reduce((s, c) => s + c.churn_probability, 0) / list.length : 0;
    const avgBill = list.length ? list.reduce((s, c) => s + c.monthly_bill, 0) / list.length : 0;
    return { highN, medN, avgProb, avgBill };
  }, [list]);

  const segCounts = useMemo(() => SEGMENT_DEFS.map((s) => {
    if (s.reasonKey) return list.filter((c: Customer) => c.churn_reason === s.reasonKey && c.risk_level !== "منخفض").length;
    return list.filter((c: Customer) => c.tenure_months >= (s.tenureMin as number) && c.risk_level === s.riskWant).length;
  }), [list]);

  return (
    <>
      <div className="filter-bar">
        <div className="filter-field">
          <label>المنطقة</label>
          <select value={filters.region} onChange={(e) => setFilters((f) => ({ ...f, region: e.target.value }))}>
            <option value="">كل المناطق</option>
            {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div className="filter-field">
          <label>نوع الباقة</label>
          <select value={filters.plan} onChange={(e) => setFilters((f) => ({ ...f, plan: e.target.value }))}>
            <option value="">كل الباقات</option>
            {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="filter-field">
          <label>فئة العمر</label>
          <select value={filters.age} onChange={(e) => setFilters((f) => ({ ...f, age: e.target.value }))}>
            <option value="">كل الفئات</option>
            {AGE_BANDS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div className="filter-field" style={{ minWidth: 200 }}>
          <label>الحد الأقصى لمدة الاشتراك <span className="range-value">{filters.tenureMax} شهر</span></label>
          <input type="range" min={1} max={120} value={filters.tenureMax} onChange={(e) => setFilters((f) => ({ ...f, tenureMax: +e.target.value }))} />
        </div>
        <div className="filter-count">{fmtNum(list.length)} عميل مطابق من أصل {fmtNum(CUSTOMERS.length)}</div>
        <button className="btn filter-reset" onClick={() => setFilters(DEFAULT_FILTERS)}>إعادة تعيين</button>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-head"><div><div className="card-title">معدل Churn حسب نوع الباقة</div><div className="card-sub">نسبة العملاء ذوي المخاطرة المرتفعة لكل باقة ضمن التصفية الحالية</div></div></div>
          <BarHChart
            items={planAgg.map((r) => ({ label: r.label, value: r.rate, color: r.rate > 9 ? "#f87171" : r.rate > 6 ? "#fbbf24" : "#34d399", sub: { k: "عدد العملاء", v: fmtNum(r.n) } }))}
            fmt={(v) => v.toFixed(1) + "٪"}
            max={Math.max(...planAgg.map((r) => r.rate), 1) * 1.35}
          />
        </div>
        <div className="card">
          <div className="card-head"><div><div className="card-title">الرضا مقابل قيمة الفاتورة</div><div className="card-sub">كل نقطة = عميل، اللون يمثل مستوى المخاطرة</div></div></div>
          <ScatterChart points={scatterPoints} xLabel="درجة الرضا (١٠–١)" yLabel="الفاتورة الشهرية" xMax={10} yMax={yMax} />
          <div className="legend">
            <div className="legend-item"><span className="legend-swatch" style={{ background: "#34d399" }} />مخاطرة منخفضة</div>
            <div className="legend-item"><span className="legend-swatch" style={{ background: "#fbbf24" }} />مخاطرة متوسطة</div>
            <div className="legend-item"><span className="legend-swatch" style={{ background: "#f87171" }} />مخاطرة مرتفعة</div>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-head"><div><div className="card-title">تحليل أسباب المغادرة</div><div className="card-sub">أهم عامل مساهم لدى العملاء متوسطي ومرتفعي المخاطرة</div></div></div>
          {reasonItems.length ? (
            <BarHChart items={reasonItems.map((r) => ({ label: r.label, value: r.value, color: "var(--accent)" }))} fmt={(v) => fmtNum(v) + " عميل"} max={Math.max(...reasonItems.map((r) => r.value)) * 1.35} />
          ) : (
            <div className="empty-state"><span>لا توجد بيانات كافية ضمن هذه التصفية</span></div>
          )}
        </div>
        <div className="card">
          <div className="card-head"><div><div className="card-title">ملخص التصفية الحالية</div></div></div>
          <div className="pf-row"><span className="pf-k">عملاء بمخاطرة مرتفعة</span><span className="pf-v tabular" style={{ color: "var(--critical)" }}>{fmtNum(summary.highN)}</span></div>
          <div className="pf-row"><span className="pf-k">عملاء بمخاطرة متوسطة</span><span className="pf-v tabular" style={{ color: "var(--warning)" }}>{fmtNum(summary.medN)}</span></div>
          <div className="pf-row"><span className="pf-k">متوسط درجة الخطورة (مؤشر نسبي)</span><span className="pf-v tabular">{summary.avgProb.toFixed(1)}٪</span></div>
          <div className="pf-row"><span className="pf-k">متوسط الفاتورة الشهرية</span><span className="pf-v tabular">{fmtNum(summary.avgBill)} د.ل</span></div>
        </div>
      </div>

      <div className="card-head" style={{ marginBottom: 8 }}>
        <div>
          <h3 style={{ fontSize: 15 }}>شرائح عملاء قابلة للتنفيذ</h3>
          <div className="card-sub">مجموعات محسوبة تلقائياً من بيانات العينة لتوجيه إجراءات الاحتفاظ</div>
        </div>
      </div>
      <div className="grid-3" style={{ marginBottom: 0 }}>
        {SEGMENT_DEFS.map((s, i) => (
          <div className="segment-card" key={s.title}>
            <div className="seg-top">
              <div>
                <div className="seg-count tabular" style={{ color: `var(--${s.color})` }}>{fmtNum(segCounts[i])}</div>
                <div className="seg-title">{s.title}</div>
              </div>
              <div className="seg-icon" style={{ background: `var(--${s.color}-soft)`, color: `var(--${s.color})` }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>{s.icon}</svg>
              </div>
            </div>
            <div className="seg-desc">{s.desc}</div>
            <div className="seg-action">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></svg>
              {s.action}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
