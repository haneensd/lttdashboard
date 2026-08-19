"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { CUSTOMERS, toCSV, pillClass } from "@/lib/data";
import { TooltipProvider } from "./Tooltip";
import OverviewView from "./OverviewView";
import AnalysisView from "./AnalysisView";
import DetailView from "./DetailView";

type Page = "overview" | "analysis" | "detail";
const PAGE_META: Record<Page, { title: string; sub: string }> = {
  overview: { title: "نظرة عامة", sub: "مؤشرات المغادرة على مستوى الشركة" },
  analysis: { title: "تحليل العملاء", sub: "فلاتر وتحليلات تفصيلية لأنماط المغادرة" },
  detail: { title: "تفاصيل العميل", sub: "ملف كامل وإجراءات احتفاظ مقترحة" },
};

declare global {
  interface Window {
    claude?: { use: (name: string) => Promise<{ save: (req: { filename: string; data: string }) => Promise<unknown> } | null> };
  }
}

async function exportHighRisk() {
  const rows = CUSTOMERS.filter((c) => c.risk_level === "مرتفع").sort((a, b) => b.churn_probability - a.churn_probability);
  const csv = toCSV(rows);
  const filename = "ltt-high-risk-customers.csv";
  try {
    if (typeof window !== "undefined" && window.claude?.use) {
      const downloads = await window.claude.use("downloads");
      if (downloads) {
        try {
          await downloads.save({ filename, data: csv });
          return true;
        } catch {
          return false;
        }
      }
    }
  } catch {
    /* fall through to browser download */
  }
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return true;
}

function DashboardInner() {
  const [page, setPage] = useState<Page>("overview");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const alertWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) setSearchOpen(false);
      if (alertWrapRef.current && !alertWrapRef.current.contains(e.target as Node)) setAlertOpen(false);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  };

  const openCustomer = (id: string) => {
    setSelectedId(id);
    setPage("detail");
    setNavOpen(false);
  };
  const goPage = (p: Page) => {
    setPage(p);
    setNavOpen(false);
  };

  const alerts = useMemo(() => CUSTOMERS.filter((c) => c.churn_probability > 75).sort((a, b) => b.churn_probability - a.churn_probability), []);
  const searchMatches = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.trim().toLowerCase();
    return CUSTOMERS.filter((c) => c.customer_name.includes(search.trim()) || c.customer_id.toLowerCase().includes(q)).slice(0, 8);
  }, [search]);

  return (
    <div id="app">
      <aside className={`nav-rail ${navOpen ? "open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">LT</div>
          <div className="brand-text">
            <span className="brand-name">LTT للاتصالات</span>
            <span className="brand-sub">توقع مغادرة العملاء</span>
          </div>
        </div>
        <nav className="nav-list">
          <div className={`nav-item ${page === "overview" ? "active" : ""}`} onClick={() => goPage("overview")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></svg>
            <span>نظرة عامة</span>
          </div>
          <div className={`nav-item ${page === "analysis" ? "active" : ""}`} onClick={() => goPage("analysis")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M3 21V9" /><path d="M10 21V3" /><path d="M17 21v-7" /></svg>
            <span>تحليل العملاء</span>
          </div>
          <div className={`nav-item ${page === "detail" ? "active" : ""}`} onClick={() => goPage("detail")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" /></svg>
            <span>تفاصيل العميل</span>
          </div>
        </nav>
        <div className="nav-foot">
          <div className="demo-badge"><span className="dot" />بيانات ونموذج تجريبي لأغراض العرض التدريبي</div>
        </div>
      </aside>

      <div className="main-col">
        <header className="topbar">
          <button className="icon-btn nav-toggle" aria-label="القائمة" onClick={() => setNavOpen((v) => !v)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <div className="page-heading">
            <h1>{PAGE_META[page].title}</h1>
            <span>{PAGE_META[page].sub}</span>
          </div>
          <div className="topbar-spacer" />
          <div className="search-wrap" ref={searchWrapRef}>
            <input
              placeholder="ابحث بالاسم أو رقم العميل…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setSearchOpen(!!e.target.value.trim()); }}
              onFocus={() => setSearchOpen(!!search.trim())}
            />
            <span className="search-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
            </span>
            {searchOpen && (
              <div className="search-results open scrollbar-thin">
                {searchMatches.length ? searchMatches.map((c) => (
                  <div className="search-result-row" key={c.customer_id} onClick={() => { setSearchOpen(false); setSearch(""); openCustomer(c.customer_id); }}>
                    <div><div className="sr-name">{c.customer_name}</div><div className="sr-meta">{c.customer_id} · {c.region}</div></div>
                    <span className={`pill ${pillClass(c.risk_level)}`}><span className="dot" />{c.churn_probability.toFixed(0)}٪</span>
                  </div>
                )) : <div className="dropdown-empty">لا توجد نتائج</div>}
              </div>
            )}
          </div>
          <div style={{ position: "relative" }} ref={alertWrapRef}>
            <button className="icon-btn" aria-label="التنبيهات" onClick={() => setAlertOpen((v) => !v)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>
              <span className="badge-dot">{alerts.length > 99 ? "99+" : alerts.length}</span>
            </button>
            {alertOpen && (
              <div className="dropdown-panel open">
                <div className="dropdown-head">تنبيهات مخاطر مرتفعة <span>احتمالية أعلى من 75٪</span></div>
                <div className="dropdown-list scrollbar-thin">
                  {alerts.length ? alerts.slice(0, 30).map((c) => (
                    <div className="alert-row" key={c.customer_id} onClick={() => { setAlertOpen(false); openCustomer(c.customer_id); }}>
                      <span className="ar-pct tabular">{c.churn_probability.toFixed(0)}٪</span>
                      <div className="ar-body"><div className="ar-name">{c.customer_name}</div><div className="ar-meta">{c.region} · {c.plan_type}</div></div>
                    </div>
                  )) : <div className="dropdown-empty">لا توجد تنبيهات حالياً</div>}
                </div>
              </div>
            )}
          </div>
          <button className="btn" onClick={() => exportHighRisk().then((ok) => ok && showToast("تم تصدير قائمة العملاء مرتفعي المخاطرة"))}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 3v12" /><path d="M7 10l5 5 5-5" /><path d="M5 21h14" /></svg>
            تصدير CSV
          </button>
        </header>

        <main>
          {page === "overview" && <OverviewView onOpenCustomer={openCustomer} />}
          {page === "analysis" && <AnalysisView />}
          {page === "detail" && <DetailView customerId={selectedId} onBack={() => goPage("overview")} onToast={showToast} />}
        </main>
      </div>

      <div className={`toast ${toast ? "show" : ""}`}>{toast}</div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <TooltipProvider>
      <DashboardInner />
    </TooltipProvider>
  );
}
