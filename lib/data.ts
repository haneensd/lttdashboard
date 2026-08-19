export type RiskLevel = "منخفض" | "متوسط" | "مرتفع";

export interface Customer {
  customer_id: string;
  customer_name: string;
  gender: "m" | "f";
  region: string;
  plan_type: string;
  tenure_months: number;
  monthly_bill: number;
  average_data_usage: number;
  complaints_count: number;
  support_calls: number;
  payment_status: string;
  satisfaction_score: number;
  contract_type: string;
  contract_end_days: number | null;
  age_band: string;
  join_date: Date;
  competitor_offer_flag: boolean;
  network_issue_flag: boolean;
  contrib: Record<string, number>;
  raw_score: number;
  churn_probability: number;
  risk_level: RiskLevel;
  churn_reason: string | null;
  recommended_action: string;
}

export interface TimelineEvent {
  date: Date;
  kind: "complaint" | "support" | "payment" | "renewal";
  desc: string;
  status: string;
}

/* ---------------- seeded RNG (deterministic so SSR/CSR renders match) ---------------- */
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260819);
const randInt = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;
function choice<T>(arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}
function weightedChoice<T>(pairs: [T, number][]): T {
  const total = pairs.reduce((s, p) => s + p[1], 0);
  let r = rand() * total;
  for (const [val, w] of pairs) {
    if (r < w) return val;
    r -= w;
  }
  return pairs[pairs.length - 1][0];
}
export function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}
export function fmtNum(n: number) {
  return Math.round(n).toLocaleString("en-US");
}
export function fmtPct(n: number, d = 1) {
  return n.toFixed(d) + "٪";
}

/* ---------------- reference data ---------------- */
export const REGIONS = ["طرابلس", "بنغازي", "مصراتة", "الزاوية", "سبها", "البيضاء", "زليتن", "صبراتة", "طبرق", "الخمس"];
export const PLANS = ["4G", "ADSL", "VDSL", "FWA", "Fiber", "Libya Phone", "MyLTT"];
const PLAN_BASE_BILL: Record<string, number> = { "4G": 60, ADSL: 45, VDSL: 70, FWA: 95, Fiber: 145, "Libya Phone": 25, MyLTT: 35 };
const PLAN_USAGE_RANGE: Record<string, [number, number]> = {
  "4G": [6, 26], ADSL: [20, 55], VDSL: [45, 110], FWA: [70, 180], Fiber: [120, 400], "Libya Phone": [0.5, 3], MyLTT: [1, 8],
};
const PLAN_WEIGHTS: [string, number][] = [["4G", 26], ["ADSL", 16], ["VDSL", 14], ["FWA", 10], ["Fiber", 18], ["Libya Phone", 9], ["MyLTT", 7]];
export const AGE_BANDS = ["18-25", "26-35", "36-45", "46-60", "60+"];
const MALE_NAMES = ["محمد", "أحمد", "علي", "عمر", "خالد", "إبراهيم", "يوسف", "عبدالله", "مصطفى", "سالم", "حسن", "فيصل", "نوري", "رمضان", "الصادق", "عادل", "ياسين", "وليد", "هشام", "طارق"];
const FEMALE_NAMES = ["فاطمة", "مريم", "آمنة", "خديجة", "زينب", "نور", "سارة", "هدى", "ليلى", "أسماء", "سلمى", "إيمان", "رانيا", "نجاة", "حنان", "سعاد", "وفاء", "منى", "راوية", "بشرى"];
const FAMILY_NAMES = ["الزوي", "المبروك", "الفيتوري", "الورفلي", "الرياني", "البرعصي", "التاجوري", "الدرناوي", "الشريف", "القمودي", "الفزاني", "البوسيفي", "النعاس", "الككلي", "الزليتني", "التركي", "الحداد", "المصراتي", "الغماري", "العبيدي"];

export const REASON_LABELS: Record<string, string> = {
  high_bill: "ارتفاع الفاتورة", network: "ضعف الشبكة", complaints: "كثرة الشكاوى",
  competitor: "عروض المنافسين", contract_end: "انتهاء العقد", other: "أسباب أخرى",
};
const ACTION_BY_REASON: Record<string, string> = {
  high_bill: "عرض خصم أو تعديل الباقة", network: "جدولة فحص فني للشبكة", complaints: "مكالمة استباقية من فريق الدعم",
  competitor: "تقديم عرض احتفاظ مخصص", contract_end: "تجديد العقد بعرض تفضيلي", other: "مراجعة يدوية من فريق الاحتفاظ",
  none_low: "متابعة دورية للحساب", none_med: "مراجعة عامة لتجربة العميل",
};
export const FACTOR_LABELS: Record<string, string> = {
  high_bill: "ارتفاع قيمة الفاتورة عن متوسط الباقة", network: "شكاوى متعلقة بجودة الشبكة",
  complaints: "تكرار الشكاوى ومكالمات الدعم", competitor: "تفاعل مع عروض من منافسين",
  contract_end: "اقتراب انتهاء العقد", payment: "تأخر أو تعثر في سداد الفاتورة",
  satisfaction: "انخفاض درجة رضا العميل", tenure_new: "عميل جديد ضمن أول 6 أشهر", noContract: "عدم وجود عقد ملزم",
};
const REASON_KEYS = ["high_bill", "network", "complaints", "competitor", "contract_end"];

const N = 1500;
export const TODAY = new Date(2026, 7, 19);

function monthsAgo(d: Date, months: number) {
  const r = new Date(d);
  r.setMonth(r.getMonth() - months);
  return r;
}
export function fmtDate(d: Date) {
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function buildCustomer(i: number): Customer {
  const gender: "m" | "f" = rand() < 0.52 ? "m" : "f";
  const first = gender === "m" ? choice(MALE_NAMES) : choice(FEMALE_NAMES);
  const name = first + " " + choice(FAMILY_NAMES);
  const region = choice(REGIONS);
  const plan_type = weightedChoice(PLAN_WEIGHTS);
  const tenure_months = randInt(1, 120);
  const baseBill = PLAN_BASE_BILL[plan_type];
  const monthly_bill = Math.round(baseBill * (0.75 + rand() * 0.75));
  const [uMin, uMax] = PLAN_USAGE_RANGE[plan_type];
  const average_data_usage = +(uMin + rand() * (uMax - uMin)).toFixed(1);

  let complaints_count: number;
  { const r = rand(); complaints_count = r < 0.52 ? 0 : r < 0.78 ? randInt(1, 2) : r < 0.93 ? randInt(3, 4) : randInt(5, 8); }
  let support_calls: number;
  { const r = rand(); support_calls = r < 0.45 ? randInt(0, 1) : r < 0.75 ? randInt(2, 3) : r < 0.92 ? randInt(4, 6) : randInt(7, 11); }

  const payment_status = weightedChoice<string>([["مدفوع", 75], ["متأخر", 18], ["معلق", 7]]);
  const contract_type = weightedChoice<string>([["سنوي", 40], ["شهري", 35], ["بدون عقد", 25]]);
  let contract_end_days: number | null = null;
  if (contract_type === "سنوي") contract_end_days = randInt(-10, 365);
  else if (contract_type === "شهري") contract_end_days = randInt(-5, 30);

  const competitor_offer_flag = rand() < 0.16;
  const network_issue_flag = rand() < (complaints_count >= 3 ? 0.42 : 0.16);

  let satisfaction_score = 10 - complaints_count * 0.7 - support_calls * 0.35 + randInt(-2, 2);
  satisfaction_score = clamp(Math.round(satisfaction_score), 1, 10);

  const age_band = choice(AGE_BANDS);
  const join_date = monthsAgo(TODAY, tenure_months);

  const contrib: Record<string, number> = {
    high_bill: monthly_bill > baseBill * 1.25 ? monthly_bill - baseBill : 0,
    network: network_issue_flag ? 22 : 0,
    complaints: complaints_count * 5 + support_calls * 3,
    competitor: competitor_offer_flag ? 18 : 0,
    contract_end: contract_end_days != null && contract_end_days >= 0 && contract_end_days <= 45 ? 46 - contract_end_days : 0,
    payment: payment_status === "معلق" ? 20 : payment_status === "متأخر" ? 10 : 0,
    satisfaction: (10 - satisfaction_score) * 3,
    tenure_new: tenure_months < 6 ? 18 : tenure_months < 12 ? 9 : 0,
    noContract: contract_type === "بدون عقد" ? 8 : 0,
  };
  const loyaltyRelief = tenure_months > 36 ? 12 : 0;
  const raw_score = Object.values(contrib).reduce((a, b) => a + b, 0) - loyaltyRelief + randInt(-6, 6);

  return {
    customer_id: "LTT-" + (100000 + i), customer_name: name, gender, region, plan_type, tenure_months,
    monthly_bill, average_data_usage, complaints_count, support_calls, payment_status,
    satisfaction_score, contract_type, contract_end_days, age_band, join_date,
    competitor_offer_flag, network_issue_flag, contrib, raw_score,
    churn_probability: 0, risk_level: "منخفض", churn_reason: null, recommended_action: "",
  };
}

function buildCustomers(): Customer[] {
  const list: Customer[] = [];
  for (let i = 0; i < N; i++) list.push(buildCustomer(i));

  /* percentile-based churn probability & risk banding, so proportions match the
     company-wide KPIs regardless of the raw scoring weights above */
  const order = list.map((_, idx) => idx).sort((a, b) => list[b].raw_score - list[a].raw_score);
  const k1 = Math.round(N * 0.0737);
  const k2 = Math.round(N * 0.2237);
  order.forEach((idx, rank) => {
    const c = list[idx];
    let prob: number;
    let risk_level: RiskLevel;
    if (rank < k1) {
      const t = rank / Math.max(k1, 1);
      prob = 97 - t * 22;
      risk_level = "مرتفع";
    } else if (rank < k2) {
      const u = (rank - k1) / Math.max(k2 - k1, 1);
      prob = 74 - u * 29;
      risk_level = "متوسط";
    } else {
      const v = (rank - k2) / Math.max(N - k2, 1);
      prob = 44 - v * 42;
      risk_level = "منخفض";
    }
    prob = clamp(prob + (rand() * 1.8 - 0.9), 1, 98.5);
    c.churn_probability = +prob.toFixed(1);
    c.risk_level = risk_level;

    let bestKey: string | null = null;
    let bestVal = 6;
    REASON_KEYS.forEach((k) => {
      if (c.contrib[k] > bestVal) {
        bestVal = c.contrib[k];
        bestKey = k;
      }
    });
    if (risk_level === "منخفض") {
      c.churn_reason = null;
      c.recommended_action = ACTION_BY_REASON.none_low;
    } else if (bestKey) {
      c.churn_reason = REASON_LABELS[bestKey];
      c.recommended_action = ACTION_BY_REASON[bestKey];
    } else {
      c.churn_reason = REASON_LABELS.other;
      c.recommended_action = risk_level === "مرتفع" ? ACTION_BY_REASON.other : ACTION_BY_REASON.none_med;
    }
  });
  return list;
}

export const CUSTOMERS: Customer[] = buildCustomers();

export const KPI = { total_customers: 250000, at_risk_customers: 18420, predicted_churn_rate: 7.4, revenue_at_risk_musd: 4.8 };
export const CHURN_TREND_12M = [6.1, 6.3, 6.0, 6.4, 6.7, 6.5, 6.9, 7.0, 6.8, 7.2, 7.1, 7.4];
export const TREND_MONTH_LABELS: string[] = (() => {
  const labels: string[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = monthsAgo(TODAY, i);
    labels.push(d.toLocaleDateString("ar-LY-u-nu-latn", { month: "short" }));
  }
  return labels;
})();

export function riskColorHex(level: RiskLevel) {
  return level === "مرتفع" ? "#f87171" : level === "متوسط" ? "#fbbf24" : "#34d399";
}
export function pillClass(level: RiskLevel) {
  return level === "مرتفع" ? "risk-high" : level === "متوسط" ? "risk-med" : "risk-low";
}

export interface Filters {
  region: string;
  plan: string;
  age: string;
  tenureMax: number;
}
export const DEFAULT_FILTERS: Filters = { region: "", plan: "", age: "", tenureMax: 120 };

export function applyFilters(list: Customer[], f: Filters) {
  return list.filter((c) => {
    if (f.region && c.region !== f.region) return false;
    if (f.plan && c.plan_type !== f.plan) return false;
    if (f.age && c.age_band !== f.age) return false;
    if (f.tenureMax != null && c.tenure_months > f.tenureMax) return false;
    return true;
  });
}

/* "churn rate" for a group = share of its customers in the high-risk band, the
   same definition behind the company-wide 7.4% KPI, so the two stay comparable */
export function groupRate(list: Customer[], keyFn: (c: Customer) => string) {
  const map = new Map<string, { n: number; high: number }>();
  list.forEach((c) => {
    const k = keyFn(c);
    if (!map.has(k)) map.set(k, { n: 0, high: 0 });
    const g = map.get(k)!;
    g.n++;
    if (c.risk_level === "مرتفع") g.high++;
  });
  return [...map.entries()].map(([label, g]) => ({ label, rate: (g.high / g.n) * 100, n: g.n }));
}

function choice2<T>(r: () => number, arr: T[]): T {
  return arr[Math.floor(r() * arr.length)];
}
export function buildTimeline(c: Customer, idx: number): TimelineEvent[] {
  const r = mulberry32(20260819 + idx * 7 + 3);
  const events: TimelineEvent[] = [];
  const templates: Record<string, string[]> = {
    complaint: ["شكوى بشأن ضعف تغطية الشبكة", "شكوى بخصوص بطء سرعة الإنترنت", "شكوى متعلقة بانقطاع متكرر للخدمة"],
    support: ["مكالمة دعم فني لحل مشكلة اتصال", "تواصل مع مركز الاتصال لطلب المساعدة", "طلب دعم فني عبر التطبيق"],
    payment: ["سداد الفاتورة الشهرية", "تأخر في سداد الفاتورة", "تسوية فاتورة متأخرة"],
    renewal: ["تجديد الباقة الحالية", "ترقية إلى باقة أعلى"],
  };
  const n = clamp(Math.round(c.complaints_count * 0.6 + c.support_calls * 0.4) + 2, 3, 7);
  for (let i = 0; i < n; i++) {
    const daysAgo = Math.round(r() * 260);
    const kind = (i === 0 ? "payment" : choice2(r, ["complaint", "support", "payment", "renewal"])) as TimelineEvent["kind"];
    const status =
      kind === "complaint" ? choice2(r, ["تم الحل", "قيد المعالجة", "مصعّدة"]) :
      kind === "support" ? choice2(r, ["مكتملة", "قيد المتابعة"]) :
      kind === "payment" ? (c.payment_status === "معلق" && i < 2 ? "متأخرة" : "مكتملة") : "مكتملة";
    events.push({ date: new Date(TODAY.getTime() - daysAgo * 86400000), kind, desc: templates[kind][Math.floor(r() * templates[kind].length)], status });
  }
  return events.sort((a, b) => b.date.getTime() - a.date.getTime());
}
export function kindLabel(k: TimelineEvent["kind"]) {
  return { complaint: "شكوى", support: "مكالمة دعم", payment: "دفعة", renewal: "باقة/عقد" }[k];
}
export function statusColor(status: string) {
  if (["تم الحل", "مكتملة"].includes(status)) return "var(--good)";
  if (["قيد المعالجة", "قيد المتابعة"].includes(status)) return "var(--accent)";
  return "var(--critical)";
}

export function toCSV(rows: Customer[]) {
  const headers = ["customer_id", "customer_name", "region", "plan_type", "tenure_months", "monthly_bill", "average_data_usage", "complaints_count", "support_calls", "payment_status", "satisfaction_score", "contract_type", "churn_probability", "risk_level", "recommended_action"];
  const lines = [headers.join(",")];
  rows.forEach((c) => {
    lines.push(
      headers
        .map((h) => {
          let v = (c as unknown as Record<string, unknown>)[h];
          if (v == null) v = "";
          const s = String(v).replace(/"/g, '""');
          return /[",\n]/.test(s) ? `"${s}"` : s;
        })
        .join(",")
    );
  });
  return "﻿" + lines.join("\r\n");
}
