"use client";

/**
 * ClockTimePicker — Android-style clock dial
 * Zero extra dependencies. Works with shadcn + Tailwind + React Hook Form.
 *
 * FIX: SVG `fill="hsl(var(--muted))"` fails when CSS vars aren't inherited
 * in the SVG context. Solution: the clock face background is a plain <div>
 * with Tailwind classes, and the SVG sits on top with `fill="transparent"`.
 * All colors use `currentColor` or explicit Tailwind classes via a CSS trick.
 */

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type Mode = "hours" | "minutes";
type Period = "AM" | "PM";

interface ClockDialProps {
  mode: Mode;
  value: number;
  onChange: (v: number) => void;
  onCommit?: () => void;
}

interface ClockTimePickerProps {
  value?: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  error?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const SIZE = 240;
const CX = SIZE / 2;
const CY = SIZE / 2;
const OUTER_R = 94;

function polarToXY(angleDeg: number, r: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
}

function xyToAngle(x: number, y: number): number {
  const dx = x - CX;
  const dy = y - CY;
  let angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
  if (angle < 0) angle += 360;
  return angle;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function parse12(h24: number): { h12: number; period: Period } {
  if (h24 === 0) return { h12: 12, period: "AM" };
  if (h24 < 12) return { h12: h24, period: "AM" };
  if (h24 === 12) return { h12: 12, period: "PM" };
  return { h12: h24 - 12, period: "PM" };
}

function to24(h12: number, period: Period): number {
  if (period === "AM") return h12 === 12 ? 0 : h12;
  return h12 === 12 ? 12 : h12 + 12;
}

// ─────────────────────────────────────────────────────────────────────────────
// ClockDial
// ─────────────────────────────────────────────────────────────────────────────

function ClockDial({ mode, value, onChange, onCommit }: ClockDialProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);

  // For hours: value is 0-23 (24h). We display 1-12 on a single ring.
  // The AM/PM toggle in the header handles the 12h↔24h conversion.
  // So on the dial we always show 1-12, and selected = the 12h equivalent of value.
  const { h12 } = parse12(value);
  const displayHour = value === 0 ? 12 : h12; // 1-12 for display

  // ── Hand angle ─────────────────────────────────────────────────────────────
  const handAngle = mode === "hours"
    ? (displayHour / 12) * 360          // 1-12 mapped to 30°-360°
    : (value / 60) * 360;               // 0-59 mapped to 0°-354°

  const handTip = polarToXY(handAngle, OUTER_R);

  // ── Numbers ────────────────────────────────────────────────────────────────
  const numbers = mode === "hours"
    ? Array.from({ length: 12 }, (_, i) => i + 1)   // 1-12
    : Array.from({ length: 12 }, (_, i) => i * 5);  // 0,5,10..55

  // ── Pointer handling ───────────────────────────────────────────────────────
  const getSVGPoint = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: CX, y: CY };
    const rect = svg.getBoundingClientRect();
    return {
      x: (clientX - rect.left) * (SIZE / rect.width),
      y: (clientY - rect.top) * (SIZE / rect.height),
    };
  }, []);

  const handlePoint = useCallback(
    (clientX: number, clientY: number) => {
      const { x, y } = getSVGPoint(clientX, clientY);
      const angle = xyToAngle(x, y);

      if (mode === "hours") {
        // Snap to nearest hour on 12h ring, then convert to 24h using current AM/PM
        const { period } = parse12(value);
        const rawH = Math.round(angle / 30) % 12 || 12; // 1-12
        onChange(to24(rawH, period));
      } else {
        onChange(Math.round(angle / 6) % 60);
      }
    },
    [mode, value, onChange, getSVGPoint]
  );

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    dragging.current = true;
    svgRef.current?.setPointerCapture(e.pointerId);
    handlePoint(e.clientX, e.clientY);
  };
  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (dragging.current) handlePoint(e.clientX, e.clientY);
  };
  const onPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragging.current) return;
    dragging.current = false;
    handlePoint(e.clientX, e.clientY);
    onCommit?.();
  };

  return (
    <div
      className="relative rounded-full bg-muted"
      style={{ width: SIZE, height: SIZE }}
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        width={SIZE}
        height={SIZE}
        className="absolute inset-0 touch-none select-none cursor-pointer"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        {/* Hand line */}
        <line
          x1={CX} y1={CY} x2={handTip.x} y2={handTip.y}
          className="stroke-primary" stroke="currentColor"
          strokeWidth={2} strokeLinecap="round"
        />
        {/* Glow */}
        <circle cx={handTip.x} cy={handTip.y} r={20}
          className="fill-primary" fill="currentColor" opacity={0.12} />
        {/* Tip */}
        <circle cx={handTip.x} cy={handTip.y} r={11}
          className="fill-primary" fill="currentColor" />
        {/* Center */}
        <circle cx={CX} cy={CY} r={4}
          className="fill-primary" fill="currentColor" />

        {/* Minute tick marks for non-5 positions */}
        {mode === "minutes" && Array.from({ length: 60 }, (_, i) => i)
          .filter((m) => m % 5 !== 0)
          .map((m) => {
            const angle = (m / 60) * 360;
            const outer = polarToXY(angle, OUTER_R - 5);
            const inner = polarToXY(angle, OUTER_R - 11);
            return (
              <line key={`t${m}`}
                x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y}
                stroke="#aaa" strokeWidth={1} opacity={0.35} />
            );
          })}

        {/* Numbers — same layout for both hours and minutes */}
        {numbers.map((n) => {
          const angle = mode === "hours"
            ? (n / 12) * 360
            : (n / 60) * 360;
          const { x, y } = polarToXY(angle, OUTER_R - 16);

          const selected = mode === "hours"
            ? n === displayHour
            : n === value;

          return (
            <g key={n}>
              {selected && (
                <circle cx={x} cy={y} r={14}
                  className="fill-primary" fill="currentColor" />
              )}
              <text
                x={x} y={y}
                textAnchor="middle" dominantBaseline="central"
                fontSize={13} fontWeight={selected ? 600 : 400}
                fill={selected ? "white" : "currentColor"}
                className={selected ? "" : "fill-foreground"}
              >
                {mode === "hours" ? n : pad(n)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ClockTimePicker
// ─────────────────────────────────────────────────────────────────────────────

export function ClockTimePicker({
  value = "",
  onChange,
  placeholder = "Select time",
  disabled = false,
  className,
  error = false,
}: ClockTimePickerProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("hours");
  const [hours, setHours] = useState<number>(9);
  const [minutes, setMinutes] = useState<number>(0);

  useEffect(() => {
    if (value?.includes(":")) {
      const [h, m] = value.split(":").map(Number);
      if (!isNaN(h)) setHours(h);
      if (!isNaN(m)) setMinutes(m);
    }
  }, [value]);

  const emit = useCallback(
    (h: number, m: number) => onChange?.(`${pad(h)}:${pad(m)}`),
    [onChange]
  );

  const handleHourChange = (h: number) => { setHours(h); emit(h, minutes); };
  const handleMinuteChange = (m: number) => { setMinutes(m); emit(hours, m); };

  const { h12, period } = parse12(hours);

  const togglePeriod = (p: Period) => {
    const newH = to24(h12, p);
    setHours(newH);
    emit(newH, minutes);
  };

  const displayValue = value
    ? `${pad(h12)}:${pad(minutes)} ${period}`
    : null;

  return (
    <Popover
      open={open}
      onOpenChange={(o) => { setOpen(o); if (o) setMode("hours"); }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start h-8 text-sm font-normal",
            !displayValue && "text-muted-foreground",
            error && "border-destructive",
            className
          )}
        >
          <Clock className="mr-2 h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
          {displayValue ?? placeholder}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0 overflow-hidden" align="start" sideOffset={4}>
        <div className="bg-popover rounded-xl shadow-2xl border border-border/50 overflow-hidden">

          {/* ── Header: time display ─────────────────────────────────── */}
          <div className="bg-primary/8 px-5 pt-4 pb-3 border-b border-border/30">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
              {mode === "hours" ? "Select hour" : "Select minute"}
            </p>
            <div className="flex items-center gap-1.5">
              {/* Hour chip */}
              <button
                type="button"
                onClick={() => setMode("hours")}
                className={cn(
                  "text-[2.5rem] leading-none font-bold tabular-nums rounded-lg px-2.5 py-1.5 transition-all",
                  mode === "hours"
                    ? "bg-primary/15 text-primary"
                    : "text-foreground/40 hover:bg-muted"
                )}
              >
                {pad(h12)}
              </button>

              <span className="text-[2.5rem] leading-none font-bold text-foreground/20 pb-0.5">
                :
              </span>

              {/* Minute chip */}
              <button
                type="button"
                onClick={() => setMode("minutes")}
                className={cn(
                  "text-[2.5rem] leading-none font-bold tabular-nums rounded-lg px-2.5 py-1.5 transition-all",
                  mode === "minutes"
                    ? "bg-primary/15 text-primary"
                    : "text-foreground/40 hover:bg-muted"
                )}
              >
                {pad(minutes)}
              </button>

              {/* AM / PM */}
              <div className="ml-1 flex flex-col gap-1">
                {(["AM", "PM"] as Period[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => togglePeriod(p)}
                    className={cn(
                      "text-xs font-semibold px-2 py-0.5 rounded-md transition-all",
                      period === p
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Clock dial ───────────────────────────────────────────── */}
          <div className="p-5 flex justify-center">
            <ClockDial
              mode={mode}
              value={mode === "hours" ? hours : minutes}
              onChange={mode === "hours" ? handleHourChange : handleMinuteChange}
              onCommit={
                mode === "hours"
                  ? () => setMode("minutes")
                  : () => setOpen(false)
              }
            />
          </div>

          {/* ── Footer ───────────────────────────────────────────────── */}
          <div className="px-4 pb-4 flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-8 text-xs min-w-13"
              onClick={() => { emit(hours, minutes); setOpen(false); }}
            >
              OK
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default ClockTimePicker;