// src/LogSheet.jsx
import React, { useMemo } from "react";

/**
 * ELD daily log (SVG) — 12-hour labeling + right "Total Hours" gutter.
 * Expects: day = {
 *   day: number,
 *   segments: [{ status: "off_duty" | "sleeper_berth" | "driving" | "on_duty_not_driving", hours: number, note?: string }]
 * }
 */

const ROWS = [
  { key: "off_duty", label: "OFF" },          // y = 0
  { key: "sleeper_berth", label: "SB" },      // y = 1
  { key: "driving", label: "DR" },            // y = 2
  { key: "on_duty_not_driving", label: "ON" } // y = 3
];

const STATUS_Y = {
  off_duty: 0,
  sleeper_berth: 1,
  driving: 2,
  on_duty_not_driving: 3,
};

export default function LogSheet({ day, height = 300 }) {
  // --- layout constants
  const width = 1060;            // a bit wider to breathe
  const leftLabelW = 56;         // OFF/SB/DR/ON labels
  const rightGutterW = 132;      // wider "Total Hours" column for HH:MM + decimals
  const gridGap = 12;            // spacing between grid and gutter
  const paddingTop = 26;         // room for top hour labels
  const paddingBottom = 28;      // room for bottom hour labels
  const gridW = width - leftLabelW - rightGutterW - gridGap;
  const gridH = height - (paddingTop + paddingBottom);
  const hourW = gridW / 24;

  // --- convert segments to plotted pieces (minute-precise to keep totals exact)
  const plotted = useMemo(() => {
    const out = [];
    let minuteCursor = 0; // minutes since day start
    const totalMins = 24 * 60;

    for (const s of (day?.segments || [])) {
      const mins = Math.max(0, Math.round((s.hours || 0) * 60));
      if (mins === 0) continue;

      const y = STATUS_Y[s.status] ?? STATUS_Y.off_duty;
      const x1 = minuteCursor;
      const x2 = Math.min(totalMins, minuteCursor + mins);
      if (x2 > x1) out.push({ x1, x2, y, status: s.status, note: s.note });

      minuteCursor = x2;
      if (minuteCursor >= totalMins) break;
    }
    return out;
  }, [day]);

  // --- totals (use minutes to avoid rounding error; sum should equal 1440)
  const totalsMin = useMemo(() => {
    const sum = (key) =>
      (day?.segments || [])
        .filter(s => s.status === key)
        .reduce((a, s) => a + Math.max(0, Math.round((s.hours || 0) * 60)), 0);

    const off = sum("off_duty");
    const sb  = sum("sleeper_berth");
    const dr  = sum("driving");
    const on  = sum("on_duty_not_driving");
    const all = off + sb + dr + on;
    return { off, sb, dr, on, all };
  }, [day]);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      className="rounded-md border bg-card text-foreground"
      role="img"
      aria-label={`ELD log for day ${day?.day ?? ""}`}
    >
      {/* left row labels */}
      <g>
        {ROWS.map((r, i) => (
          <g key={r.key} transform={`translate(0, ${paddingTop + (gridH / 4) * i})`}>
            <text x={10} y={4} fontSize="12" fill="currentColor">{r.label}</text>
          </g>
        ))}
      </g>

      {/* grid */}
      <g transform={`translate(${leftLabelW}, ${paddingTop})`}>
        {/* grid border */}
        <rect
          x={0}
          y={0}
          width={gridW}
          height={gridH}
          fill="transparent"
          stroke="currentColor"
          strokeOpacity="0.35"
        />

        {/* horizontal duty lines */}
        {Array.from({ length: 4 }).map((_, i) => (
          <line
            key={`h-${i}`}
            x1={0}
            y1={(gridH / 4) * i}
            x2={gridW}
            y2={(gridH / 4) * i}
            stroke="currentColor"
            strokeOpacity="0.30"
          />
        ))}

        {/* vertical hour lines with bolder midnight/noon */}
        {Array.from({ length: 25 }).map((_, i) => {
          const isBold = i === 0 || i === 12 || i === 24;
          return (
            <line
              key={`v-${i}`}
              x1={i * hourW}
              y1={0}
              x2={i * hourW}
              y2={gridH}
              stroke="currentColor"
              strokeOpacity={isBold ? 0.6 : 0.15}
              strokeWidth={isBold ? 1.5 : 1}
              shapeRendering="crispEdges"
            />
          );
        })}

        {/* top hour labels (12-hour style). Omit the far-right "Mid" to keep space clean */}
        {Array.from({ length: 25 }).map((_, i) => (
          <text
            key={`t-top-${i}`}
            x={i * hourW}
            y={-8}
            fontSize="10"
            textAnchor="middle"
            fill="currentColor"
          >
            {i === 24 ? "" : hourLabel12(i)}
          </text>
        ))}
        {/* bottom hour labels */}
        {Array.from({ length: 25 }).map((_, i) => (
          <text
            key={`t-bot-${i}`}
            x={i * hourW}
            y={gridH + 18}
            fontSize="10"
            textAnchor="middle"
            fill="currentColor"
          >
            {hourLabel12(i)}
          </text>
        ))}

        {/* plotted segments */}
        <g>
          {plotted.map((p, idx) => {
            const y = (gridH / 4) * p.y;
            const x1 = (p.x1 / 60) * hourW;
            const x2 = (p.x2 / 60) * hourW;

            const colorByStatus = {
              off_duty: "currentColor",
              sleeper_berth: "currentColor",
              driving: "hsl(var(--primary))",
              on_duty_not_driving: "currentColor",
            };
            const strokeColor = colorByStatus[p.status] || "currentColor";
            const widthSeg = p.status === "driving" ? 4 : 3;

            // Note placement: below the OFF row line to avoid clashing with top labels
            const noteBelow = p.status === "off_duty";
            const noteY = noteBelow ? y + 12 : y - 8;

            return (
              <g key={idx}>
                {/* connector from previous segment end */}
                {idx > 0 && (
                  <line
                    x1={(plotted[idx - 1].x2 / 60) * hourW}
                    y1={(gridH / 4) * plotted[idx - 1].y}
                    x2={x1}
                    y2={y}
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeOpacity="0.85"
                  />
                )}
                {/* main segment */}
                <line
                  x1={x1}
                  y1={y}
                  x2={x2}
                  y2={y}
                  stroke={strokeColor}
                  strokeWidth={widthSeg}
                  strokeOpacity="1"
                  strokeLinecap="round"
                />
                {/* optional note */}
                {p.note && (
                  <text
                    x={(x1 + x2) / 2}
                    y={noteY}
                    fontSize="10"
                    textAnchor="middle"
                    fill="currentColor"
                    opacity="0.85"
                  >
                    {p.note}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </g>

      {/* small gap between grid and gutter */}
      <g transform={`translate(${leftLabelW + gridW}, ${paddingTop})`}>
        <rect x={0} y={0} width={gridGap} height={gridH} fill="transparent" />
      </g>

      {/* right "Total Hours" gutter (clean, legible) */}
      <g transform={`translate(${leftLabelW + gridW + gridGap}, 0)`}>
        {/* header with overall day total */}
        <text
          x={rightGutterW / 2}
          y={16}
          fontSize="12"
          fontWeight="600"
          textAnchor="middle"
          fill="currentColor"
        >
          Total Hours • {fmtHM(totalsMin.all)}
        </text>

        <g transform={`translate(0, ${paddingTop})`}>
          {/* border */}
          <rect
            x={0}
            y={0}
            width={rightGutterW}
            height={gridH}
            fill="transparent"
            stroke="currentColor"
            strokeOpacity="0.5"
          />
          {/* row dividers to align with grid rows */}
          {Array.from({ length: 4 }).map((_, i) => (
            <line
              key={`rg-h-${i}`}
              x1={0}
              y1={(gridH / 4) * i}
              x2={rightGutterW}
              y2={(gridH / 4) * i}
              stroke="currentColor"
              strokeOpacity="0.35"
            />
          ))}

          {/* OFF total */}
          <GutterRow
            y={rowCenterY(0, gridH)}
            w={rightGutterW}
            primary={fmtHM(totalsMin.off)}
            secondary={`(${fmtHours(totalsMin.off)})`}
          />
          {/* SB total */}
          <GutterRow
            y={rowCenterY(1, gridH)}
            w={rightGutterW}
            primary={fmtHM(totalsMin.sb)}
            secondary={`(${fmtHours(totalsMin.sb)})`}
          />
          {/* DR total */}
          <GutterRow
            y={rowCenterY(2, gridH)}
            w={rightGutterW}
            primary={fmtHM(totalsMin.dr)}
            secondary={`(${fmtHours(totalsMin.dr)})`}
          />
          {/* ON total */}
          <GutterRow
            y={rowCenterY(3, gridH)}
            w={rightGutterW}
            primary={fmtHM(totalsMin.on)}
            secondary={`(${fmtHours(totalsMin.on)})`}
          />

          {/* bottom-right: tiny checksum (should be 24:00) */}
          <text
            x={rightGutterW - 6}
            y={gridH - 6}
            fontSize="10"
            textAnchor="end"
            fill="currentColor"
            opacity="0.75"
          >
            = {fmtHM(totalsMin.all)}
          </text>
        </g>
      </g>
    </svg>
  );
}

/* ---------- helpers ---------- */

function hourLabel12(i) {
  if (i === 0 || i === 24) return "Mid";
  if (i === 12) return "Noon";
  if (i < 12) return String(i);       // 1..11
  return String(i - 12);              // 1..11 (pm)
}
function rowCenterY(rowIndex, gridH) {
  const rowH = gridH / 4;
  return rowH * rowIndex + rowH / 2;
}
function fmtHM(mins) {
  const m = Math.max(0, Math.round(mins || 0));
  const h = Math.floor(m / 60);
  const mm = String(m % 60).padStart(2, "0");
  return `${h}:${mm}`;
}
function fmtHours(mins) {
  const hrs = (Math.max(0, mins || 0) / 60);
  return `${Number(hrs.toFixed(2))} h`;
}

/** Row content inside the gutter: big HH:MM with small (decimal h) underneath */
function GutterRow({ y, w, primary, secondary }) {
  return (
    <>
      <text
        x={w / 2}
        y={y - 2}
        fontSize="13"
        fontWeight="700"
        textAnchor="middle"
        fill="currentColor"
      >
        {primary}
      </text>
      <text
        x={w / 2}
        y={y + 12}
        fontSize="10"
        textAnchor="middle"
        fill="currentColor"
        opacity="0.8"
      >
        {secondary}
      </text>
    </>
  );
}
