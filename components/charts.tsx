"use client";
import { useState } from "react";
import { useTooltip, TooltipRow } from "./Tooltip";
import { fmtNum, clamp } from "@/lib/data";

const VB_W = 600;

export function LineAreaChart({ series, height = 220 }: { series: { label: string; value: number }[]; height?: number }) {
  const { show, hide } = useTooltip();
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const w = VB_W;
  const padL = 8, padR = 8, padT = 16, padB = 26;
  const plotW = w - padL - padR, plotH = height - padT - padB;
  const maxV = Math.max(...series.map((s) => s.value)) * 1.18;
  const minV = 0;
  const n = series.length;
  const xAt = (i: number) => padL + (plotW - (i / (n - 1)) * plotW);
  const yAt = (v: number) => padT + plotH - ((v - minV) / (maxV - minV)) * plotH;

  const gridLines = [0, 1, 2, 3].map((g) => minV + ((maxV - minV) * g) / 3);
  const areaD = `M ${xAt(0)} ${yAt(0)} ` + series.map((s, i) => `L ${xAt(i)} ${yAt(s.value)} `).join("") + `L ${xAt(n - 1)} ${yAt(0)} Z`;
  const lineD = series.map((s, i) => `${i === 0 ? "M" : "L"} ${xAt(i)} ${yAt(s.value)} `).join("");
  const lastX = xAt(n - 1), lastY = yAt(series[n - 1].value);
  const gradId = "trendGrad";

  const onMove = (e: React.PointerEvent<SVGRectElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * w;
    let idx = Math.round(((plotW - (mx - padL)) / plotW) * (n - 1));
    idx = clamp(idx, 0, n - 1);
    setHoverIdx(idx);
    show(e.clientX, e.clientY, (
      <>
        <div className="tt-title">{series[idx].label}</div>
        <TooltipRow swatch="var(--accent-line)" label="معدل المغادرة" value={series[idx].value.toFixed(1) + "٪"} />
      </>
    ));
  };

  return (
    <svg viewBox={`0 0 ${w} ${height}`} width="100%" height={height} style={{ display: "block", overflow: "visible" }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent-line)" stopOpacity={0.32} />
          <stop offset="100%" stopColor="var(--accent-line)" stopOpacity={0} />
        </linearGradient>
      </defs>
      {gridLines.map((gv, i) => (
        <g key={i}>
          <line x1={padL} x2={w - padR} y1={yAt(gv)} y2={yAt(gv)} stroke="var(--border)" strokeWidth={1} />
          <text x={w - padR} y={yAt(gv) - 4} textAnchor="end" fill="var(--text-muted)" fontSize={10}>{gv.toFixed(1)}٪</text>
        </g>
      ))}
      <path d={areaD} fill={`url(#${gradId})`} stroke="none" />
      <path d={lineD} fill="none" stroke="var(--accent-line)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lastX} cy={lastY} r={5} fill="var(--accent-strong)" stroke="var(--surface-1)" strokeWidth={2} />
      <text x={lastX} y={lastY - 11} textAnchor="middle" fill="var(--text-primary)" fontSize={11} fontWeight={800}>
        {series[n - 1].value.toFixed(1)}٪
      </text>
      {series.map((s, i) => (i % 2 === 0 || n <= 8) && (
        <text key={i} x={xAt(i)} y={height - 8} textAnchor="middle" fill="var(--text-muted)" fontSize={10}>{s.label}</text>
      ))}
      {hoverIdx != null && (
        <>
          <line x1={xAt(hoverIdx)} x2={xAt(hoverIdx)} y1={padT} y2={padT + plotH} stroke="var(--border-strong)" strokeWidth={1} />
          <circle cx={xAt(hoverIdx)} cy={yAt(series[hoverIdx].value)} r={4} fill="var(--accent-strong)" stroke="var(--surface-1)" strokeWidth={2} />
        </>
      )}
      <rect x={padL} y={0} width={plotW} height={height} fill="transparent" onPointerMove={onMove} onPointerLeave={() => { setHoverIdx(null); hide(); }} />
    </svg>
  );
}

export function DonutChart({ segments, centerValue, centerLabel, height = 220 }: { segments: { label: string; value: number; color: string }[]; centerValue: string; centerLabel: string; height?: number }) {
  const { show, hide } = useTooltip();
  const [hoverI, setHoverI] = useState<number | null>(null);
  const w = height;
  const cx = w / 2, cy = height / 2, rOuter = Math.min(w, height) / 2 - 6, rInner = rOuter * 0.62;
  const total = segments.reduce((s, x) => s + x.value, 0);
  const gapDeg = 0.018;
  const startAngle = -Math.PI / 2;
  const arcs = segments.map((seg, i) => {
    const before = segments.slice(0, i).reduce((s, x) => s + x.value, 0);
    const angle = startAngle + (before / total) * 2 * Math.PI;
    const frac = seg.value / total;
    const a0 = angle + gapDeg, a1 = angle + frac * 2 * Math.PI - gapDeg;
    const large = a1 - a0 > Math.PI ? 1 : 0;
    const p = (r: number, a: number): [number, number] => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
    const [x0, y0] = p(rOuter, a0), [x1, y1] = p(rOuter, a1), [x2, y2] = p(rInner, a1), [x3, y3] = p(rInner, a0);
    const d = `M ${x0} ${y0} A ${rOuter} ${rOuter} 0 ${large} 1 ${x1} ${y1} L ${x2} ${y2} A ${rInner} ${rInner} 0 ${large} 0 ${x3} ${y3} Z`;
    return { d, frac, seg, i };
  });
  return (
    <svg viewBox={`0 0 ${w} ${height}`} width={height} height={height} style={{ display: "block" }}>
      {arcs.map(({ d, frac, seg, i }) => (
        <path
          key={i}
          d={d}
          fill={seg.color}
          stroke="var(--surface-1)"
          strokeWidth={2}
          opacity={hoverI === i ? 0.82 : 1}
          style={{ cursor: "pointer", transition: "opacity .12s" }}
          onPointerEnter={(e) => {
            setHoverI(i);
            show(e.clientX, e.clientY, (
              <>
                <div className="tt-title">{seg.label}</div>
                <TooltipRow swatch={seg.color} label="عدد العملاء" value={fmtNum(seg.value)} />
                <TooltipRow label="النسبة" value={(frac * 100).toFixed(1) + "٪"} />
              </>
            ));
          }}
          onPointerMove={(e) => show(e.clientX, e.clientY, (
            <>
              <div className="tt-title">{seg.label}</div>
              <TooltipRow swatch={seg.color} label="عدد العملاء" value={fmtNum(seg.value)} />
              <TooltipRow label="النسبة" value={(frac * 100).toFixed(1) + "٪"} />
            </>
          ))}
          onPointerLeave={() => { setHoverI(null); hide(); }}
        />
      ))}
      <text x={cx} y={cy - 2} textAnchor="middle" fill="var(--text-primary)" fontSize={22} fontWeight={800}>{centerValue}</text>
      <text x={cx} y={cy + 17} textAnchor="middle" fill="var(--text-muted)" fontSize={10.5}>{centerLabel}</text>
    </svg>
  );
}

export interface BarItem { label: string; value: number; color: string; sub?: { k: string; v: string } }
export function BarHChart({ items, fmt, max, rowH = 30, labelW = 96 }: { items: BarItem[]; fmt?: (v: number) => string; max?: number; rowH?: number; labelW?: number }) {
  const { show, hide } = useTooltip();
  const [hoverI, setHoverI] = useState<number | null>(null);
  const w = VB_W;
  const gap = 10, padL = 8, padR = 54;
  const h = items.length * rowH + (items.length - 1) * gap + 10;
  const plotW = w - padL - padR - labelW;
  const maxV = max != null ? max : Math.max(...items.map((i) => i.value)) * 1.08;
  const fmtFn = fmt || ((v: number) => v.toFixed(1));
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} style={{ display: "block", overflow: "visible" }}>
      {items.map((it, i) => {
        const y = i * (rowH + gap);
        const barLen = clamp((it.value / maxV) * plotW, 2, plotW);
        const barStartX = padL + labelW + (plotW - barLen);
        return (
          <g key={i}>
            <rect x={padL + labelW} y={y} width={plotW} height={rowH} rx={6} fill="var(--surface-3)" />
            <text x={padL + labelW - 10} y={y + rowH / 2 + 4} textAnchor="end" fill="var(--text-secondary)" fontSize={12}>{it.label}</text>
            <rect x={barStartX} y={y} width={barLen} height={rowH} rx={6} fill={it.color} opacity={hoverI === i ? 0.82 : 1} style={{ cursor: "pointer" }} />
            <text x={barStartX - 8} y={y + rowH / 2 + 4} textAnchor="end" fill="var(--text-primary)" fontSize={11.5} fontWeight={800}>{fmtFn(it.value)}</text>
            <rect
              x={padL + labelW} y={y} width={plotW} height={rowH} fill="transparent" style={{ cursor: "pointer" }}
              onPointerEnter={(e) => {
                setHoverI(i);
                show(e.clientX, e.clientY, (
                  <>
                    <div className="tt-title">{it.label}</div>
                    <TooltipRow swatch={it.color} label="القيمة" value={fmtFn(it.value)} />
                    {it.sub && <TooltipRow label={it.sub.k} value={it.sub.v} />}
                  </>
                ));
              }}
              onPointerMove={(e) => show(e.clientX, e.clientY, (
                <>
                  <div className="tt-title">{it.label}</div>
                  <TooltipRow swatch={it.color} label="القيمة" value={fmtFn(it.value)} />
                  {it.sub && <TooltipRow label={it.sub.k} value={it.sub.v} />}
                </>
              ))}
              onPointerLeave={() => { setHoverI(null); hide(); }}
            />
          </g>
        );
      })}
    </svg>
  );
}

export interface ScatterPoint { x: number; y: number; name: string; risk: string; color: string }
export function ScatterChart({ points, xLabel, yLabel, xMax, yMax, height = 280 }: { points: ScatterPoint[]; xLabel: string; yLabel: string; xMax: number; yMax: number; height?: number }) {
  const { show, hide } = useTooltip();
  const [hoverI, setHoverI] = useState<number | null>(null);
  const w = VB_W;
  const padL = 40, padR = 16, padT = 16, padB = 34;
  const plotW = w - padL - padR, plotH = height - padT - padB;
  const xAt = (x: number) => padL + (plotW - (x / xMax) * plotW);
  const yAt = (y: number) => padT + plotH - (y / yMax) * plotH;
  return (
    <svg viewBox={`0 0 ${w} ${height}`} width="100%" height={height} style={{ display: "block", overflow: "visible" }}>
      {[0, 1, 2, 3, 4].map((g) => (
        <line key={g} x1={padL} x2={w - padR} y1={padT + (plotH * g) / 4} y2={padT + (plotH * g) / 4} stroke="var(--border)" strokeWidth={1} />
      ))}
      <text x={padL + plotW / 2} y={height - 6} textAnchor="middle" fill="var(--text-muted)" fontSize={10.5}>{xLabel}</text>
      <text x={12} y={padT + 10} textAnchor="start" fill="var(--text-muted)" fontSize={10.5}>{yLabel}</text>
      {points.map((pt, i) => {
        const cx = xAt(pt.x), cy = yAt(pt.y);
        return (
          <g key={i}>
            <circle cx={cx} cy={cy} r={hoverI === i ? 6.5 : 4.5} fill={pt.color} stroke="var(--surface-1)" strokeWidth={1.5} opacity={0.85} />
            <circle
              cx={cx} cy={cy} r={12} fill="transparent" style={{ cursor: "pointer" }}
              onPointerEnter={(e) => {
                setHoverI(i);
                show(e.clientX, e.clientY, (
                  <>
                    <div className="tt-title">{pt.name}</div>
                    <TooltipRow label={xLabel} value={String(pt.x)} />
                    <TooltipRow label={yLabel} value={fmtNum(pt.y)} />
                    <TooltipRow swatch={pt.color} label="المخاطرة" value={pt.risk} />
                  </>
                ));
              }}
              onPointerMove={(e) => show(e.clientX, e.clientY, (
                <>
                  <div className="tt-title">{pt.name}</div>
                  <TooltipRow label={xLabel} value={String(pt.x)} />
                  <TooltipRow label={yLabel} value={fmtNum(pt.y)} />
                  <TooltipRow swatch={pt.color} label="المخاطرة" value={pt.risk} />
                </>
              ))}
              onPointerLeave={() => { setHoverI(null); hide(); }}
            />
          </g>
        );
      })}
    </svg>
  );
}

export function GaugeChart({ pct, color }: { pct: number; color: string }) {
  const w = 200, h = 120, cx = 100, cy = 110, r = 86;
  const polar = (ang: number, rr: number): [number, number] => [cx + rr * Math.cos(ang), cy - rr * Math.sin(ang)];
  const describeArc = (a0: number, a1: number, rr: number) => {
    const [x0, y0] = polar(a0, rr), [x1, y1] = polar(a1, rr);
    const large = Math.abs(a1 - a0) > Math.PI ? 1 : 0;
    return `M ${x0} ${y0} A ${rr} ${rr} 0 ${large} 0 ${x1} ${y1}`;
  };
  const frac = clamp(pct / 100, 0, 1);
  const endAngle = Math.PI - frac * Math.PI;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={220} height={132} style={{ display: "block" }}>
      <path d={describeArc(Math.PI, 0, r)} fill="none" stroke="var(--surface-3)" strokeWidth={16} strokeLinecap="round" />
      <path d={describeArc(Math.PI, endAngle, r)} fill="none" stroke={color} strokeWidth={16} strokeLinecap="round" />
      <text x={cx} y={cy - 18} textAnchor="middle" fill="var(--text-primary)" fontSize={30} fontWeight={800}>{pct.toFixed(1)}٪</text>
    </svg>
  );
}
