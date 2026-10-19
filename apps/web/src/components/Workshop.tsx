'use client'

import { layout } from '@notenn/argoat'
import { arrange, hohner2915GC, pickMelodyTrack, type Song, type Track } from '@notenn/engine'
import { fromAbc, fromFile, ImportError } from '@notenn/import'
import { useTranslations } from 'next-intl'
import React, { useEffect, useMemo, useRef, useState } from 'react'

import { play, type Playback } from '@/lib/player'
import { ArgoatSheet, type Cursor } from './ArgoatSheet'

/** Auld Lang Syne, traditional Scottish tune (public domain). */
const SAMPLE = `X:1
T:Auld Lang Syne
M:4/4
L:1/8
Q:1/4=80
K:C
G2|c3c c2e2|d3c d2ed|c3c e2g2|a6a2|g3e e2c2|d3c d2e2|c3A A2G2|c6a2|
g3e e2c2|d3c d2a2|g3e e2g2|a6c'2|g3e e2c2|d3c d2e2|c3A A2G2|c8|]`

const WIDTH = 900
const profile = hohner2915GC

/** Something went wrong, as a translation key (never a hard-coded message). */
type Problem = { key: string } | null

const signed = (n: number) => (n > 0 ? `+${n}` : String(n))

export function Workshop() {
  const t = useTranslations('workshop')
  const te = useTranslations('errors')
  const tl = useTranslations('lines')
  const ti = useTranslations('instruments')

  const [song, setSong] = useState<Song | null>(null)
  const [abc, setAbc] = useState(SAMPLE)
  const [problem, setProblem] = useState<Problem>(null)
  const [track, setTrack] = useState(0)
  const [fromBar, setFromBar] = useState(1)
  const [toBar, setToBar] = useState(0)
  const [rows, setRows] = useState<'all' | 'inner'>('all')
  const [staff, setStaff] = useState(true)
  const [bass, setBass] = useState(true)
  const [transpose, setTranspose] = useState<'auto' | number>('auto')
  const [tempo, setTempo] = useState(80)
  const [cursor, setCursor] = useState<Cursor | null>(null)
  const playback = useRef<Playback | null>(null)
  const raf = useRef(0)

  const load = (s: Song) => {
    if (!s.tracks.length) return setProblem({ key: 'noNotes' })
    stop()
    setSong(s)
    setTrack(pickMelodyTrack(s.tracks))
    setFromBar(1)
    setToBar(0)
    setTempo(s.tempo || 90)
    setProblem(null)
  }
  const attempt = async (f: () => Promise<Song>) => {
    try {
      load(await f())
    } catch (e) {
      setProblem({ key: e instanceof ImportError ? `import.${e.code}` : 'unknown' })
    }
  }

  useEffect(() => {
    void attempt(() => fromAbc(SAMPLE))
    return () => stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const lineLabels = useMemo(() => ({ push: tl('push'), pull: tl('pull'), bass: tl('bass') }), [tl])

  const result = useMemo(() => {
    if (!song) return null
    try {
      const innerRow = profile.rows[0]!.id
      const arr = arrange(song, profile, {
        trackIndex: track,
        rows: rows === 'all' ? undefined : [innerRow],
        fromBar,
        toBar: toBar || undefined,
        transpose,
        bass,
      })
      const lines = layout(arr, profile, song.meter, { width: WIDTH, staff, labels: lineLabels })
      return { arr, lines, failed: false }
    } catch {
      return { arr: null, lines: [], failed: true }
    }
  }, [song, track, rows, fromBar, toBar, transpose, bass, staff, lineLabels])

  // Changing a setting recomputes the tab: the playback in progress no longer matches it.
  useEffect(() => stop(), [result, tempo])

  function stop() {
    cancelAnimationFrame(raf.current)
    playback.current?.stop()
    playback.current = null
    setCursor(null)
  }

  function start() {
    if (!result?.arr) return
    stop()
    const arr = result.arr
    const pb = play(arr, profile, tempo)
    playback.current = pb
    const tick = () => {
      const time = pb.position()
      if (time > pb.endsAt + 0.2) return stop()
      // Only events that are still sounding stay highlighted (nothing during rests).
      const note = arr.notes.findIndex((n) => n.start <= time + 1e-6 && time < n.start + n.dur)
      const bassLen = arr.meter.beat * 0.55
      const b = arr.bass.findIndex((ev) => ev.time <= time + 1e-6 && time < ev.time + bassLen)
      const n = arr.notes[note]
      setCursor({ time: Math.max(time, arr.notes[0]?.start ?? 0), note, bass: b, noteStart: n?.start, noteDur: n?.dur })
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
  }

  const trackName = (tr: Track, i: number) =>
    tr.name || (tr.instrument ? t('trackInstrument', { n: i + 1, instrument: tr.instrument }) : t('trackFallback', { n: i + 1 }))

  const arr = result?.arr
  const shownProblem = problem ?? (result?.failed ? { key: 'unknown' } : null)

  return (
    <div className="workshop">
      <div className="grid">
        <section className="panel">
          <h2>{t('song')}</h2>
          <label>
            {t('file')}
            <input
              type="file"
              accept=".mid,.midi,.musicxml,.xml,.mxl,.abc"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void attempt(() => fromFile(f))
              }}
            />
          </label>
          <p className="hint">{t('pasteAbc')}</p>
          <textarea value={abc} onChange={(e) => setAbc(e.target.value)} aria-label={t('abcLabel')} />
          <div className="row" style={{ marginTop: 8 }}>
            <button onClick={() => void attempt(() => fromAbc(abc))}>{t('loadAbc')}</button>
          </div>
        </section>

        <section className="panel">
          <h2>{t('settings')}</h2>
          <div className="row">
            {song && song.tracks.length > 1 && (
              <label>
                {t('melodyTrack')}
                <select value={track} onChange={(e) => setTrack(Number(e.target.value))}>
                  {song.tracks.map((tr, i) => (
                    <option key={i} value={i}>
                      {t('trackOption', { name: trackName(tr, i), count: tr.notes.length })}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label>
              {t('fromBar')}
              <input type="number" min={1} value={fromBar} onChange={(e) => setFromBar(Math.max(1, Number(e.target.value) || 1))} />
            </label>
            <label>
              {t('toBar')}
              <input
                type="number"
                min={0}
                value={toBar || ''}
                placeholder={t('end')}
                onChange={(e) => setToBar(Math.max(0, Number(e.target.value) || 0))}
              />
            </label>
          </div>
          <div className="row" style={{ marginTop: 10 }}>
            <label>
              {t('rows')}
              <select value={rows} onChange={(e) => setRows(e.target.value as 'all' | 'inner')}>
                <option value="all">{t('rowsAll')}</option>
                <option value="inner">{t('rowsInner')}</option>
              </select>
            </label>
            <label>
              {t('transpose')}
              <select value={String(transpose)} onChange={(e) => setTranspose(e.target.value === 'auto' ? 'auto' : Number(e.target.value))}>
                <option value="auto">{t('auto')}</option>
                {Array.from({ length: 25 }, (_, i) => i - 12).map((v) => (
                  <option key={v} value={v}>
                    {t('semitones', { value: Math.abs(v), signed: signed(v) })}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t('tempo')}
              <input
                type="number"
                min={30}
                max={240}
                value={tempo}
                onChange={(e) => setTempo(Math.min(240, Math.max(30, Number(e.target.value) || 80)))}
              />
            </label>
          </div>
          <div className="row" style={{ marginTop: 10, gap: 16 }}>
            <label className="inline">
              <input type="checkbox" checked={staff} onChange={(e) => setStaff(e.target.checked)} /> {t('staff')}
            </label>
            <label className="inline">
              <input type="checkbox" checked={bass} onChange={(e) => setBass(e.target.checked)} /> {t('basses')}
            </label>
          </div>
          <div className="row" style={{ marginTop: 14 }}>
            {cursor ? (
              <button onClick={stop}>{t('stop')}</button>
            ) : (
              <button className="primary" onClick={start} disabled={!arr}>
                {t('listen')}
              </button>
            )}
          </div>
        </section>
      </div>

      {shownProblem && <p className="pill err">{te(shownProblem.key)}</p>}

      {arr && song && (
        <section className="sheet">
          <h3>{song.title || t('untitled')}</h3>
          <p className="sub">
            {t('subtitle', {
              instrument: ti.has(profile.id) ? ti(profile.id) : profile.name,
              meter: `${song.meter.num}/${song.meter.den}`,
              from: arr.fromBar,
              to: arr.toBar,
            })}
          </p>
          <div className="pills" style={{ marginBottom: 10 }}>
            <span className="pill">{arr.transpose === 0 ? t('originalKey') : t('transposed', { signed: signed(arr.transpose) })}</span>
            <span className="pill">{t('bellowsChanges', { count: arr.bellowsChanges })}</span>
            {arr.approxCount > 0 && <span className="pill warn">{t('replaced', { count: arr.approxCount })}</span>}
          </div>
          <div className="legend">
            <span>
              <b className="p">{tl('push')}</b> {t('legendPush')}
            </span>
            <span>
              <b className="t">{tl('pull')}</b> {t('legendPull')}
            </span>
            <span>{t('legendRows')}</span>
            <span>{t('legendHold')}</span>
            {bass && (
              <span>
                <b className="b">●</b> {t('legendBass')} · <b className="b">○</b> {t('legendChord')}
              </span>
            )}
            <span>{t('legendBeats')}</span>
          </div>
          <ArgoatSheet lines={result.lines} width={WIDTH} cursor={cursor} />
        </section>
      )}
    </div>
  )
}
