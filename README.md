# lttdashboard — LTT Churn Prediction Dashboard

لوحة تحكم تجريبية لشركة LTT لتوقع احتمالية مغادرة العملاء (Churn)، مبنية بواجهة عربية كاملة
(RTL) لمساعدة فرق خدمة العملاء والمبيعات على اتخاذ إجراءات استباقية.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4 (plus a small custom design-token stylesheet in `app/globals.css`)
- No backend / database — all data is a seeded, synthetic dataset of 1,500 Libyan
  telecom customers generated client-side in `lib/data.ts` (deterministic, so
  numbers stay stable across reloads and between server/client renders)

This diverges from the `ltt-ai-webapp-builder` skill's default Supabase-backed
stack: the dashboard is read-only analytics over generated demo data, so a
database isn't needed for the MVP.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

```bash
npm run build   # production build (run before every deploy)
npm run lint    # ESLint
```

## Project structure

```
app/                Next.js App Router entry (layout, page, global styles)
components/          Dashboard shell, chart primitives, and the 3 views
  Dashboard.tsx       Nav + header (search/alerts/export) + page routing
  OverviewView.tsx    KPIs, trend, risk donut, region chart, at-risk table
  AnalysisView.tsx     Filters, plan/scatter/reasons charts, actionable segments
  DetailView.tsx      Customer profile, risk gauge, factors, timeline, actions
  charts.tsx          Reusable SVG chart components (line/donut/bar/scatter/gauge)
  Tooltip.tsx         Shared hover-tooltip context
lib/data.ts           Types, synthetic data generation, aggregation helpers
```

## Pages

1. **نظرة عامة** — company-wide KPIs, 12-month churn trend, risk distribution,
   churn rate by region, top at-risk customers table.
2. **تحليل العملاء** — filters (region/plan/age/tenure) driving churn-by-plan,
   satisfaction-vs-bill scatter, churn-reason breakdown, and actionable segments.
3. **تفاصيل العميل** — full profile, churn-probability gauge, top contributing
   factors, interaction/payment timeline, and suggested retention actions.

## Data & security notes

- Synthetic data only — no real customer records, per the skill's training
  safety rules.
- CSV export (high-risk customers) uses a normal browser download in this
  deployed app.
