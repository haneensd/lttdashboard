"use client";
import { useMemo, useState } from "react";
import { CUSTOMERS, buildTimeline, kindLabel, statusColor, fmtDate, fmtNum, riskColorHex, pillClass, FACTOR_LABELS } from "@/lib/data";
import { GaugeChart } from "./charts";

const ACTIONS = ["خصم مؤقت على الفاتورة", "ترقية إلى باقة أعلى قيمة", "مكالمة من فريق الدعم المخصص", "عرض مخصص للاحتفاظ"];

export default function DetailView({ customerId, onBack, onToast }: { customerId: string | null; onBack: () => void; onToast: (msg: string) => void }) {
  const [doneActions, setDoneActions] = useState<Set<number>>(new Set());
  const idx = useMemo(() => CUSTOMERS.findIndex((c) => c.customer_id === customerId), [customerId]);
  const c = idx === -1 ? null : CUSTOMERS[idx];
  const events = useMemo(() => (c ? buildTimeline(c, idx) : []), [c, idx]);

  if (!c) {
    return (
      <div className="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" /></svg>
        <span>اختر عميلاً من &quot;نظرة عامة&quot; أو &quot;تحليل العملاء&quot; أو ابحث عنه بالاسم أو رقم العميل لعرض ملفه الكامل.</span>
      </div>
    );
  }

  const initials = c.customer_name.split(" ")[0][0];
  const topFactors = Object.entries(c.contrib).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const maxFactor = topFactors.length ? topFactors[0][1] : 1;

  return (
    <>
      <div className="back-link" onClick={onBack}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M13 5l-7 7 7 7" /><path d="M6 12h15" /></svg>
        رجوع إلى القائمة
      </div>
      <div className="detail-grid">
        <div className="card profile-card">
          <div className="avatar">{initials}</div>
          <div>
            <div className="profile-name">{c.customer_name}</div>
            <div className="profile-id tabular">{c.customer_id}</div>
          </div>
          <span className={`pill ${pillClass(c.risk_level)}`}><span className="dot" />مخاطرة {c.risk_level}</span>
          <div className="profile-facts">
            <div className="pf-row"><span className="pf-k">الباقة</span><span className="pf-v">{c.plan_type}</span></div>
            <div className="pf-row"><span className="pf-k">المنطقة</span><span className="pf-v">{c.region}</span></div>
            <div className="pf-row"><span className="pf-k">تاريخ الانضمام</span><span className="pf-v tabular">{fmtDate(c.join_date)}</span></div>
            <div className="pf-row"><span className="pf-k">مدة الاشتراك</span><span className="pf-v tabular">{c.tenure_months} شهر</span></div>
            <div className="pf-row"><span className="pf-k">متوسط الإنفاق الشهري</span><span className="pf-v tabular">{fmtNum(c.monthly_bill)} د.ل</span></div>
            <div className="pf-row"><span className="pf-k">نوع العقد</span><span className="pf-v">{c.contract_type}</span></div>
            <div className="pf-row"><span className="pf-k">حالة السداد</span><span className="pf-v">{c.payment_status}</span></div>
            <div className="pf-row"><span className="pf-k">الفئة العمرية</span><span className="pf-v">{c.age_band}</span></div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
          <div className="grid-2" style={{ marginBottom: 0 }}>
            <div className="card" style={{ alignItems: "center" }}>
              <div className="card-title" style={{ alignSelf: "flex-start" }}>احتمالية المغادرة</div>
              <div className="gauge-wrap">
                <GaugeChart pct={c.churn_probability} color={riskColorHex(c.risk_level)} />
                <div className="gauge-caption">{c.churn_reason ? `أبرز الأسباب: ${c.churn_reason}` : "لا يوجد سبب مهيمن — مخاطرة منخفضة"}</div>
              </div>
            </div>
            <div className="card">
              <div className="card-title">أهم العوامل المؤثرة في التوقع</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {topFactors.length ? topFactors.map(([k, v]) => (
                  <div className="factor-row" key={k}>
                    <div className="factor-top"><span className="f-name">{FACTOR_LABELS[k]}</span><span className="f-val">{Math.round((v / maxFactor) * 100)}٪</span></div>
                    <div className="factor-track"><div className="factor-fill" style={{ width: `${Math.round((v / maxFactor) * 100)}%` }} /></div>
                  </div>
                )) : <div className="card-sub">لا توجد عوامل خطر بارزة لدى هذا العميل حالياً.</div>}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-title">سجل التفاعل والشكاوى والمدفوعات</div>
            <div className="timeline">
              {events.map((ev, i) => (
                <div className="tl-item" key={i}>
                  <div className="tl-dot-wrap">
                    <div className="tl-dot" style={{ background: statusColor(ev.status) }} />
                    {i < events.length - 1 && <div className="tl-line" />}
                  </div>
                  <div className="tl-body">
                    <div className="tl-head"><span>{kindLabel(ev.kind)} — {ev.desc}</span><span className="tl-date">{fmtDate(ev.date)}</span></div>
                    <div className="tl-desc" style={{ color: statusColor(ev.status) }}>{ev.status}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-title">إجراءات احتفاظ مقترحة</div>
            <div className="action-grid">
              {ACTIONS.map((a, i) => (
                <button
                  key={a}
                  className={`action-btn ${doneActions.has(i) ? "done" : ""}`}
                  onClick={() => {
                    setDoneActions((s) => new Set(s).add(i));
                    onToast(`تم تسجيل الإجراء لحساب ${c.customer_name}`);
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M9 12l2 2 4-4" /><circle cx="12" cy="12" r="9" /></svg>
                  {a}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
