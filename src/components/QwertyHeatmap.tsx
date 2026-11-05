import React, { useState } from 'react';
import type { KeyStatsMap } from '../engine/types';

export interface KeyCapDef {
  id: string;
  primary: string;
  secondary?: string;
  width?: number; // in relative key units (1 = 44px)
}

export const KEYBOARD_ROWS: KeyCapDef[][] = [
  [
    { id: '`', primary: '`', secondary: '~', width: 1 },
    { id: '1', primary: '1', secondary: '!', width: 1 },
    { id: '2', primary: '2', secondary: '@', width: 1 },
    { id: '3', primary: '3', secondary: '#', width: 1 },
    { id: '4', primary: '4', secondary: '$', width: 1 },
    { id: '5', primary: '5', secondary: '%', width: 1 },
    { id: '6', primary: '6', secondary: '^', width: 1 },
    { id: '7', primary: '7', secondary: '&', width: 1 },
    { id: '8', primary: '8', secondary: '*', width: 1 },
    { id: '9', primary: '9', secondary: '(', width: 1 },
    { id: '0', primary: '0', secondary: ')', width: 1 },
    { id: '-', primary: '-', secondary: '_', width: 1 },
    { id: '=', primary: '=', secondary: '+', width: 1 },
    { id: 'Backspace', primary: '⌫', width: 1.75 },
  ],
  [
    { id: 'Tab', primary: 'Tab', width: 1.4 },
    { id: 'q', primary: 'q', secondary: 'Q', width: 1 },
    { id: 'w', primary: 'w', secondary: 'W', width: 1 },
    { id: 'e', primary: 'e', secondary: 'E', width: 1 },
    { id: 'r', primary: 'r', secondary: 'R', width: 1 },
    { id: 't', primary: 't', secondary: 'T', width: 1 },
    { id: 'y', primary: 'y', secondary: 'Y', width: 1 },
    { id: 'u', primary: 'u', secondary: 'U', width: 1 },
    { id: 'i', primary: 'i', secondary: 'I', width: 1 },
    { id: 'o', primary: 'o', secondary: 'O', width: 1 },
    { id: 'p', primary: 'p', secondary: 'P', width: 1 },
    { id: '[', primary: '[', secondary: '{', width: 1 },
    { id: ']', primary: ']', secondary: '}', width: 1 },
    { id: '\\', primary: '\\', secondary: '|', width: 1.35 },
  ],
  [
    { id: 'Caps', primary: 'Caps', width: 1.65 },
    { id: 'a', primary: 'a', secondary: 'A', width: 1 },
    { id: 's', primary: 's', secondary: 'S', width: 1 },
    { id: 'd', primary: 'd', secondary: 'D', width: 1 },
    { id: 'f', primary: 'f', secondary: 'F', width: 1 },
    { id: 'g', primary: 'g', secondary: 'G', width: 1 },
    { id: 'h', primary: 'h', secondary: 'H', width: 1 },
    { id: 'j', primary: 'j', secondary: 'J', width: 1 },
    { id: 'k', primary: 'k', secondary: 'K', width: 1 },
    { id: 'l', primary: 'l', secondary: 'L', width: 1 },
    { id: ';', primary: ';', secondary: ':', width: 1 },
    { id: "'", primary: "'", secondary: '"', width: 1 },
    { id: 'Enter', primary: 'Enter ↵', width: 2.1 },
  ],
  [
    { id: 'ShiftLeft', primary: 'Shift', width: 2.15 },
    { id: 'z', primary: 'z', secondary: 'Z', width: 1 },
    { id: 'x', primary: 'x', secondary: 'X', width: 1 },
    { id: 'c', primary: 'c', secondary: 'C', width: 1 },
    { id: 'v', primary: 'v', secondary: 'V', width: 1 },
    { id: 'b', primary: 'b', secondary: 'B', width: 1 },
    { id: 'n', primary: 'n', secondary: 'N', width: 1 },
    { id: 'm', primary: 'm', secondary: 'M', width: 1 },
    { id: ',', primary: ',', secondary: '<', width: 1 },
    { id: '.', primary: '.', secondary: '>', width: 1 },
    { id: '/', primary: '/', secondary: '?', width: 1 },
    { id: 'ShiftRight', primary: 'Shift', width: 2.6 },
  ],
  [
    { id: 'Space', primary: 'Space', width: 6.5 },
  ],
];

interface QwertyHeatmapProps {
  mode: 'heatmap' | 'live-overlay';
  keyStats?: KeyStatsMap;
  nextExpectedChar?: string;
  minSamples?: number;
  className?: string;
}

function getAggregatedKeyStat(
  def: KeyCapDef,
  stats: KeyStatsMap
): { count: number; avgMs: number; errorPct: number; errors: number; matchedKey: string } {
  const candidates = [def.primary];
  if (def.secondary) candidates.push(def.secondary);
  if (def.id === 'Space') candidates.push(' ');

  let count = 0;
  let totalLatency = 0;
  let errors = 0;
  let bestKey = def.primary;
  let maxKeyLat = -1;

  for (const ch of candidates) {
    const entry = stats[ch];
    if (entry && entry.count > 0) {
      count += entry.count;
      totalLatency += entry.totalLatencyMs;
      errors += entry.errors;
      const avg = entry.totalLatencyMs / entry.count;
      if (avg > maxKeyLat) {
        maxKeyLat = avg;
        bestKey = ch === ' ' ? 'Space' : ch;
      }
    }
  }

  const avgMs = count > 0 ? Math.round(totalLatency / count) : 0;
  const errorPct = count > 0 ? Math.round((errors / count) * 100) : 0;
  return { count, avgMs, errorPct, errors, matchedKey: bestKey };
}

export const QwertyHeatmap: React.FC<QwertyHeatmapProps> = ({
  mode,
  keyStats = {},
  nextExpectedChar,
  minSamples = 1,
  className = '',
}) => {
  const [hoveredInfo, setHoveredInfo] = useState<{
    label: string;
    avgMs: number;
    errorPct: number;
    count: number;
  } | null>(null);

  const UNIT = 44;
  const GAP = 6;
  const ROW_H = 42;
  const SVG_W = 735;
  const SVG_H = KEYBOARD_ROWS.length * (ROW_H + GAP) + 8;

  const doesNeedShift = (ch?: string): boolean => {
    if (!ch || ch === 'Enter' || ch === ' ') return false;
    for (const row of KEYBOARD_ROWS) {
      for (const k of row) {
        if (k.secondary === ch) return true;
      }
    }
    return false;
  };

  const shiftNeeded = mode === 'live-overlay' && doesNeedShift(nextExpectedChar);

  return (
    <div className={`w-full ${className}`}>
      {mode === 'heatmap' && (
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 text-xs font-mono-code text-[var(--text-muted)]">
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-[2px] border border-[var(--line)] bg-[var(--card)]" />
              Fast (&lt;140ms)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                className="inline-block w-3 h-3 rounded-[2px] border border-[var(--line)]"
                style={{ backgroundColor: 'color-mix(in srgb, var(--accent) 26%, var(--card))' }}
              />
              Moderate (140–210ms)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                className="inline-block w-3 h-3 rounded-[2px] border border-[var(--accent)]"
                style={{ backgroundColor: 'color-mix(in srgb, var(--accent) 55%, var(--card))' }}
              />
              Slow (&gt;210ms)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-[var(--error)]" />
              Errors logged
            </span>
          </div>
          <div className="min-h-[20px] text-[var(--ink)] font-medium">
            {hoveredInfo ? (
              <span>
                Key <strong className="px-1.5 py-0.5 border border-[var(--line)] rounded-[2px] bg-[var(--paper)]">{hoveredInfo.label}</strong>
                {' · '}
                {hoveredInfo.count > 0
                  ? `avg ${hoveredInfo.avgMs} ms · ${hoveredInfo.errorPct}% errors (${hoveredInfo.count} samples)`
                  : 'No keystrokes recorded yet'}
              </span>
            ) : (
              <span>Hover any key for latency and error breakdown</span>
            )}
          </div>
        </div>
      )}

      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          className="w-full max-w-[760px] mx-auto block select-none font-mono-code"
          role="img"
          aria-label={
            mode === 'heatmap'
              ? 'QWERTY keyboard slow-key latency heatmap'
              : 'On-screen keyboard guide showing next expected key'
          }
        >
          {KEYBOARD_ROWS.map((row, rowIdx) => {
            const totalRowUnits = row.reduce((acc, k) => acc + (k.width ?? 1), 0);
            const totalRowPx = totalRowUnits * UNIT + (row.length - 1) * GAP;
            let cursorX = (SVG_W - totalRowPx) / 2;
            const y = rowIdx * (ROW_H + GAP) + 4;

            return (
              <g key={rowIdx}>
                {row.map((k) => {
                  const w = (k.width ?? 1) * UNIT;
                  const x = cursorX;
                  cursorX += w + GAP;

                  const isNextTarget =
                    mode === 'live-overlay' &&
                    ((nextExpectedChar === ' ' && k.id === 'Space') ||
                      (nextExpectedChar === 'Enter' && k.id === 'Enter') ||
                      nextExpectedChar === k.primary ||
                      nextExpectedChar === k.secondary ||
                      (shiftNeeded && (k.id === 'ShiftLeft' || k.id === 'ShiftRight')));

                  const stat =
                    mode === 'heatmap'
                      ? getAggregatedKeyStat(k, keyStats)
                      : { count: 0, avgMs: 0, errorPct: 0, errors: 0, matchedKey: k.primary };

                  let fillStyle = 'var(--card)';
                  let strokeStyle = 'var(--line)';
                  let textColor = 'var(--ink)';

                  if (mode === 'live-overlay' && isNextTarget) {
                    fillStyle = 'var(--accent)';
                    strokeStyle = 'var(--ink)';
                    textColor = '#1B1A17';
                  } else if (mode === 'heatmap' && stat.count >= minSamples) {
                    if (stat.avgMs >= 210) {
                      fillStyle = 'color-mix(in srgb, var(--accent) 55%, var(--card))';
                      strokeStyle = 'var(--accent)';
                    } else if (stat.avgMs >= 140) {
                      fillStyle = 'color-mix(in srgb, var(--accent) 26%, var(--card))';
                    }
                  }

                  return (
                    <g
                      key={k.id}
                      onMouseEnter={() => {
                        if (mode === 'heatmap') {
                          setHoveredInfo({
                            label: k.secondary ? `${k.primary} / ${k.secondary}` : k.primary,
                            avgMs: stat.avgMs,
                            errorPct: stat.errorPct,
                            count: stat.count,
                          });
                        }
                      }}
                      onMouseLeave={() => {
                        if (mode === 'heatmap') setHoveredInfo(null);
                      }}
                      className={mode === 'heatmap' ? 'cursor-pointer' : ''}
                    >
                      {/* Keycap 3px bottom depth */}
                      <rect
                        x={x}
                        y={y + 2}
                        width={w}
                        height={ROW_H}
                        rx={3}
                        fill="var(--line)"
                      />
                      <rect
                        x={x}
                        y={y}
                        width={w}
                        height={ROW_H}
                        rx={3}
                        fill={fillStyle}
                        stroke={strokeStyle}
                        strokeWidth={isNextTarget ? 1.5 : 1}
                      />

                      {k.secondary && (
                        <text
                          x={x + 7}
                          y={y + 13}
                          fontSize="10"
                          fill={isNextTarget ? '#1B1A17' : 'var(--text-muted)'}
                        >
                          {k.secondary}
                        </text>
                      )}

                      <text
                        x={k.secondary ? x + w / 2 + 2 : x + w / 2}
                        y={k.secondary ? y + 29 : y + 25}
                        textAnchor="middle"
                        fontSize={k.primary.length > 2 ? '11' : '13'}
                        fontWeight="600"
                        fill={textColor}
                      >
                        {k.primary}
                      </text>

                      {/* Error corner dot in heatmap mode */}
                      {mode === 'heatmap' && stat.errors > 0 && (
                        <circle
                          cx={x + w - 6}
                          cy={y + 6}
                          r={3}
                          fill="var(--error)"
                        />
                      )}
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
