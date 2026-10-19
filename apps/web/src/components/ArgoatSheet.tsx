'use client'

import type { DrawOp, SystemLine } from '@notenn/argoat'
import { useTranslations } from 'next-intl'
import React from 'react'

const fill = (ink: string) => `var(--${ink})`

function Op({ op, hotNote, hotBass }: { op: DrawOp; hotNote: number; hotBass: number }) {
  switch (op.kind) {
    case 'text':
      return (
        <text
          x={op.x}
          y={op.y}
          fontSize={op.size}
          fontWeight={op.bold ? 700 : 400}
          fontFamily={op.mono ? 'var(--mono)' : 'var(--body)'}
          textAnchor={op.anchor ?? 'start'}
          style={{ fill: fill(op.ink) }}
          className={op.note !== undefined && op.note === hotNote ? 'hot' : undefined}
        >
          {op.text}
        </text>
      )
    case 'line':
      return <line x1={op.x1} y1={op.y1} x2={op.x2} y2={op.y2} style={{ stroke: fill(op.ink) }} strokeWidth={op.width} strokeLinecap="round" />
    case 'ellipse':
      return (
        <ellipse
          cx={op.x}
          cy={op.y}
          rx={op.rx}
          ry={op.ry}
          transform={`rotate(-20 ${op.x} ${op.y})`}
          style={{ fill: op.filled ? fill(op.ink) : 'none', stroke: fill(op.ink) }}
          strokeWidth={1.1}
          className={op.note !== undefined && op.note === hotNote ? 'hot' : undefined}
        />
      )
    case 'polyline':
      return (
        <polyline
          points={op.points.map((p) => p.join(',')).join(' ')}
          style={{ fill: 'none', stroke: fill(op.ink) }}
          strokeWidth={op.width}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )
    case 'circle':
      return (
        <g>
          <circle
            cx={op.x}
            cy={op.y}
            r={op.r}
            style={{ fill: op.filled ? 'var(--bass)' : 'var(--surface)', stroke: 'var(--bass)' }}
            strokeWidth={1.2}
            className={op.bass === hotBass ? 'hot' : undefined}
          />
          <text x={op.x} y={op.y + 3} textAnchor="middle" fontSize={8} fontWeight={700} style={{ fill: op.filled ? 'var(--surface)' : 'var(--bass)' }}>
            {op.label}
          </text>
        </g>
      )
  }
}

export interface Cursor {
  time: number
  note: number
  bass: number
  /** Start and duration of the sounding note, for the highlight band. */
  noteStart?: number
  noteDur?: number
}

interface Props {
  lines: SystemLine[]
  width: number
  cursor: Cursor | null
  /** Practised passage, in quarter notes: everything outside it is dimmed. */
  passage?: { start: number; end: number }
  /** Index of the note whose fingering is being edited. */
  selected?: number
  /** Called with the note index and the clicked element when a button number is chosen. */
  onNoteClick?: (note: number, target: Element) => void
  /** Accessible name of a note's button, e.g. "6' push". */
  describeNote?: (note: number) => string
}

export function ArgoatSheet({ lines, width, cursor, passage, selected, onNoteClick, describeNote }: Props) {
  const t = useTranslations('workshop')
  return (
    <div className="argoat-sheet">
      {lines.map((l) => {
        const active = cursor && cursor.time >= l.start && cursor.time < l.end
        const x = active ? l.x0 + (cursor.time - l.start) * l.scale : 0
        const X = (q: number) => l.x0 + (q - l.start) * l.scale
        const dimBefore = passage && passage.start > l.start ? Math.min(X(passage.start), width) : 0
        const dimAfter = passage && passage.end < l.end ? Math.max(X(passage.end), 0) : width
        return (
          <svg key={l.firstBar} viewBox={`0 0 ${width} ${l.height}`} role="group" aria-label={t('barsAria', { from: l.firstBar, to: l.lastBar })}>
            {active && cursor.noteStart !== undefined && cursor.noteDur !== undefined && (
              <rect
                x={l.x0 + (cursor.noteStart - l.start) * l.scale - 6}
                y={0}
                width={Math.max(20, cursor.noteDur * l.scale)}
                height={l.height}
                style={{ fill: 'var(--hl)', opacity: 0.55 }}
              />
            )}
            {l.ops.map((op, i) => (
              <Op key={i} op={op} hotNote={active ? cursor.note : -1} hotBass={active ? cursor.bass : -1} />
            ))}
            {passage && dimBefore > 0 && <rect x={0} y={0} width={dimBefore} height={l.height} className="dim" />}
            {passage && dimAfter < width && <rect x={dimAfter} y={0} width={width - dimAfter} height={l.height} className="dim" />}
            {onNoteClick &&
              l.ops.map((op, i) =>
                op.kind === 'text' && op.note !== undefined ? (
                  <rect
                    key={`hit${i}`}
                    x={op.x - 4}
                    y={op.y - 14}
                    width={op.text.length * 7.6 + 8}
                    height={19}
                    rx={4}
                    className={op.note === selected ? 'note-hit selected' : 'note-hit'}
                    role="button"
                    tabIndex={0}
                    aria-label={describeNote?.(op.note)}
                    onClick={(e) => onNoteClick(op.note!, e.currentTarget)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onNoteClick(op.note!, e.currentTarget)
                      }
                    }}
                  />
                ) : null,
              )}
            {active && <line x1={x} x2={x} y1={2} y2={l.height - 6} style={{ stroke: 'var(--cur)' }} strokeWidth={2.2} opacity={0.85} />}
          </svg>
        )
      })}
    </div>
  )
}
