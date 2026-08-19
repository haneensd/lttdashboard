"use client";
import { useMemo, useState } from "react";
import { CUSTOMERS, KPI, CHURN_TREND_12M, TREND_MONTH_LABELS, groupRate, fmtNum, fmtPct, pillClass } from "@/lib/data";
import { LineAreaChart, DonutChart, BarHChart } from "./charts";

export default function OverviewView({ onOpenCustomer }: { onOpenCustomer: (id: string) => void }) {
  const [search, setSearch] = useState("");
  const [sortDir, setSortDir] = useState<1 | -1>(-1);

  const trendSeries = useMemo(() => CHURN_TREND_12M.map((v, i) => ({ label: TREND_MONTH_LABELS[i], value: v })), []);

  const riskCounts = useMemo(() => {
    const high = CUSTOMERS.filter((c) => c.risk_level === "مرتفع").length;
    const med = CUSTOMERS.filter((c) => c.risk_level === "متوسط").length;
    const low = CUSTOMERS.length - high - med;
    return { high, med, low };
  }, []);
  const riskSegs = [
    { label: "منخفض", value: riskCounts.low, color: "#34d399" },
    { label: "متوسط", value: riskCounts.med, color: "#fbbf24" },
    { label: "مرتفع", value: riskCounts.high, color: "#f87171" },
  ];

  const regionAgg = useMemo(() => groupRate(CUSTOMERS, (c) => c.region).sort((a, b) => b.rate - a.rate), []);

  const tableRows = useMemo(() => {
    const rows = CUSTOMERS.slice()
      .sort((a, b) => (a.churn_probability - b.churn_probability) * sortDir)
      .slice(0, 400)
      .filter((c) => !search || c.customer_name.includes(search) || c.customer_id.toLowerCase().includes(search.toLowerCase()))
      .filter((c) => c.risk_level !== "منخفض" || search)
      .slice(0, 40);
    return rows;
  }, [search, sortDir]);

  return (
    <>
      <div className="kpi-grid">
        <div className="kpi-card" style={{ ["--kpi-glow" as string]: "rgba(56,189,248,0.18)" }}>
          <div className="kpi-top">
            <span className="kpi-label">إجمالي العملاء</span>
            <div className="kpi-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="9" cy="8" r="3.2" /><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" /><circle cx="17" cy="8.5" r="2.6" /><path d="M15.5 14.3c2.6.5 4 2.4 4 5.7" /></svg>
            </div>
          </div>
          <div className="kpi-value tabular">{fmtNum(KPI.total_customers)}</div>
          <span className="kpi-delta neutral">قاعدة عملاء LTT بجميع الخدمات</span>
        </div>
        <div className="kpi-card" style={{ ["--kpi-glow" as string]: "rgba(248,113,113,0.18)" }}>
          <div className="kpi-top">
            <span className="kpi-label">العملاء المعرضون للمغادرة</span>
            <div className="kpi-icon" style={{ background: "var(--critical-soft)", color: "var(--critical)" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 9v4" /><path d="M12 16.5h.01" /><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /></svg>
            </div>
          </div>
          <div className="kpi-value tabular">{fmtNum(KPI.at_risk_customers)}</div>
          <span className="kpi-delta up-bad">+٪٦.٢ عن الشهر الماضي</span>
        </div>
        <div className="kpi-card" style={{ ["--kpi-glow" as string]: "rgba(251,191,36,0.18)" }}>
          <div className="kpi-top">
            <span className="kpi-label">معدل Churn المتوقع</span>
            <div className="kpi-icon" style={{ background: "var(--warning-soft)", color: "var(--warning)" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M3 17l6-6 4 4 8-8" /><path d="M15 6h6v6" /></svg>
            </div>
          </div>
          <div className="kpi-value tabular">{fmtPct(KPI.predicted_churn_rate)}</div>
          <span className="kpi-delta up-bad">+٠.٣ نقطة خلال ٣ أشهر</span>
        </div>
        <div className="kpi-card" style={{ ["--kpi-glow" as string]: "rgba(52,211,153,0.14)" }}>
          <div className="kpi-top">
            <span className="kpi-label">الإيراد المعرض للخطر</span>
            <div className="kpi-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 2v20" /><path d="M17 5.5c0-1.9-2.2-3.5-5-3.5s-5 1.6-5 3.5 2.2 3.2 5 3.5c2.8.3 5 1.6 5 3.5s-2.2 3.5-5 3.5-5-1.6-5-3.5" /></svg>
            </div>
          </div>
          <div className="kpi-value tabular">{KPI.revenue_at_risk_musd.toFixed(1)} م.د.ل</div>
          <span className="kpi-delta neutral">القيمة الشهرية المقدرة للحسابات المعرضة</span>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">معدل Churn خلال آخر ١٢ شهراً</div>
              <div className="card-sub">النسبة الشهرية لاحتمالية المغادرة على مستوى الشركة</div>
            </div>
            <span className="card-tag">شهري</span>
          </div>
          <LineAreaChart series={trendSeries} />
        </div>
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">توزيع العملاء حسب مستوى المخاطر</div>
              <div className="card-sub">من إجمالي قاعدة العملاء</div>
            </div>
          </div>
          <div style={{ alignSelf: "center" }}>
            <DonutChart segments={riskSegs} centerValue={fmtPct((riskCounts.high / CUSTOMERS.length) * 100)} centerLabel="مخاطر مرتفعة" />
          </div>
          <div className="legend" style={{ justifyContent: "center" }}>
            {riskSegs.map((s) => (
              <div className="legend-item" key={s.label}>
                <span className="legend-swatch" style={{ background: s.color }} />
                {s.label} ({((s.value / CUSTOMERS.length) * 100).toFixed(0)}٪)
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-head">
          <div>
            <div className="card-title">معدل Churn حسب المنطقة</div>
            <div className="card-sub">نسبة العملاء ذوي المخاطرة المرتفعة في العينة التفصيلية (١٥٠٠ عميل) لكل مدينة</div>
          </div>
          <span className="card-tag">حسب المدينة</span>
        </div>
        <BarHChart
          items={regionAgg.map((r) => ({ label: r.label, value: r.rate, color: r.rate > 9 ? "#f87171" : r.rate > 6 ? "#fbbf24" : "#34d399", sub: { k: "عدد العملاء بالعينة", v: fmtNum(r.n) } }))}
          fmt={(v) => v.toFixed(1) + "٪"}
          max={Math.max(...regionAgg.map((r) => r.rate)) * 1.35}
        />
        <div className="legend">
          <div className="legend-item"><span className="legend-swatch" style={{ background: "var(--good)" }} />منخفض &lt; ٦٪</div>
          <div className="legend-item"><span className="legend-swatch" style={{ background: "var(--warning)" }} />متوسط ٦–٩٪</div>
          <div className="legend-item"><span className="legend-swatch" style={{ background: "var(--critical)" }} />مرتفع &gt; ٩٪</div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div>
            <div className="card-title">أكثر العملاء عرضة للمغادرة</div>
            <div className="card-sub">مرتبون حسب درجة المخاطرة — انقر على أي صف لعرض التفاصيل</div>
          </div>
        </div>
        <div className="table-toolbar">
          <div className="mini-search"><input placeholder="ابحث في هذا الجدول…" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          <span className="filter-count">عرض {tableRows.length} من أصل {fmtNum(KPI.at_risk_customers)} عميل معرض للمخاطرة</span>
        </div>
        <div className="table-wrap scrollbar-thin">
          <table className="dtable">
            <thead>
              <tr>
                <th>الاسم</th><th>المنطقة</th><th>الباقة</th><th className="num">قيمة الفاتورة</th>
                <th className="sortable num" onClick={() => setSortDir((d) => (d === 1 ? -1 : 1))}>
                  درجة المخاطرة <span className="sort-ind">{sortDir === 1 ? "▲" : "▼"}</span>
                </th>
                <th>الإجراء المقترح</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.length ? tableRows.map((c) => (
                <tr key={c.customer_id} className={c.churn_probability > 75 ? "row-alert" : ""} onClick={() => onOpenCustomer(c.customer_id)}>
                  <td className="name-cell">{c.customer_name}</td>
                  <td>{c.region}</td>
                  <td>{c.plan_type}</td>
                  <td className="num tabular">{fmtNum(c.monthly_bill)} د.ل</td>
                  <td className="num tabular"><span className={`pill ${pillClass(c.risk_level)}`}><span className="dot" />{c.churn_probability.toFixed(1)}٪</span></td>
                  <td>{c.recommended_action}</td>
                </tr>
              )) : (
                <tr><td colSpan={6}><div className="table-empty">لا توجد نتائج مطابقة</div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
