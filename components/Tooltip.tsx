"use client";
import { createContext, useContext, useRef, useState, ReactNode } from "react";

interface TooltipApi {
  show: (x: number, y: number, content: ReactNode) => void;
  hide: () => void;
}
const TooltipCtx = createContext<TooltipApi | null>(null);

export function useTooltip() {
  const ctx = useContext(TooltipCtx);
  if (!ctx) throw new Error("useTooltip must be used within TooltipProvider");
  return ctx;
}

export function TooltipProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [content, setContent] = useState<ReactNode>(null);
  const posRef = useRef({ x: 0, y: 0 });
  const [pos, setPos] = useState({ left: -9999, top: -9999 });
  const elRef = useRef<HTMLDivElement>(null);

  const show = (x: number, y: number, node: ReactNode) => {
    posRef.current = { x, y };
    setContent(node);
    setVisible(true);
    requestAnimationFrame(() => {
      const el = elRef.current;
      if (!el) return;
      const pad = 14;
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      let left = x + pad;
      let top = y - h / 2;
      if (left + w > window.innerWidth - 8) left = x - w - pad;
      top = Math.max(8, Math.min(window.innerHeight - h - 8, top));
      setPos({ left, top });
    });
  };
  const hide = () => setVisible(false);

  return (
    <TooltipCtx.Provider value={{ show, hide }}>
      {children}
      <div
        id="viz-tooltip"
        ref={elRef}
        className={visible ? "show" : ""}
        style={{ transform: `translate(${pos.left}px, ${pos.top}px)` }}
      >
        {content}
      </div>
    </TooltipCtx.Provider>
  );
}

export function TooltipRow({ swatch, label, value }: { swatch?: string; label: string; value: string }) {
  return (
    <div className="tt-row">
      <span className="tt-key">
        {swatch && <span className="tt-line" style={{ background: swatch }} />}
        {label}
      </span>
      <span className="tt-val">{value}</span>
    </div>
  );
}
